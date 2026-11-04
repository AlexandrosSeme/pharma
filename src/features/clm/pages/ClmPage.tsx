import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { nameVisible, useScope } from '@/features/team'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { FilterChips, PageHeader, SearchInput } from '@/shared/ui'
import { daysUntil, formatClock, isExpired, isExpiring, localized } from '../lib/text'
import { useClmDecks, useClmSessions } from '../queries'
import { EXPIRING_WITHIN_DAYS, type ClmAudience, type ClmDeck, type ClmSession, type ClmSlideView } from '../types'
import styles from './ClmPage.module.css'

type AudienceFilter = 'all' | ClmAudience | 'expiring'

export function ClmPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { formatDate, formatTime } = useFormatters()
  const decks = useClmDecks()
  const sessions = useClmSessions()
  const { watched, scopeRole, focus } = useScope()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<AudienceFilter>('all')
  const term = useDebounce(search).trim().toLowerCase()
  const lang = i18n.resolvedLanguage

  const deckById = useMemo(() => new Map((decks.data ?? []).map((deck) => [deck.id, deck])), [decks.data])
  const recent = useMemo(
    () =>
      [...(sessions.data ?? [])]
        .filter((session) => nameVisible(session.repName, focus, scopeRole, watched))
        .sort((a, b) => b.endedAt.localeCompare(a.endedAt)),
    [sessions.data, focus, scopeRole, watched],
  )
  const days = useMemo(() => groupByDay(recent), [recent])

  const visible = (decks.data ?? []).filter((deck) => {
    if (filter === 'expiring' && !isExpiring(deck.approvedUntil, EXPIRING_WITHIN_DAYS)) return false
    if (filter === 'hcp' && deck.audience !== 'hcp') return false
    if (filter === 'pharmacy' && deck.audience !== 'pharmacy') return false
    if (!term) return true
    return [deck.productName, deck.code, localized(deck.title, 'en'), localized(deck.title, 'el')]
      .join(' ')
      .toLowerCase()
      .includes(term)
  })

  const loading = decks.isLoading || sessions.isLoading
  const error = decks.error ?? sessions.error

  return (
    <section className={styles.page}>
      <PageHeader
        title={t('clm.title')}
        subtitle={t('clm.subtitle')}
        actions={
          <Link to="/clm/feedback" className="btn btn-outline-primary btn-sm">
            {t('clm.feedback.link')}
          </Link>
        }
      />

      {loading && (
        <div className="d-flex align-items-center gap-2 text-body-secondary">
          <div className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
          {t('common.loading')}
        </div>
      )}
      {error && (
        <div className="alert alert-danger mb-0" role="alert">
          {t('common.error', { message: error.message })}
        </div>
      )}

      {!loading && !error && (
        <div className={styles.layout}>
          <div className={styles.library}>
            <div className={styles.toolbar}>
              <SearchInput value={search} onChange={setSearch} placeholder={t('clm.search')} />
              <FilterChips
                aria-label={t('clm.filters')}
                value={filter}
                onChange={setFilter}
                chips={[
                  { value: 'all', label: t('clm.filter.all'), count: decks.data?.length },
                  { value: 'hcp', label: t('clm.filter.hcp') },
                  { value: 'pharmacy', label: t('clm.filter.pharmacy') },
                  { value: 'expiring', label: t('clm.filter.expiring') },
                ]}
              />
            </div>
            {visible.length === 0 ? (
              <p className={styles.empty}>{t('common.empty')}</p>
            ) : (
              <ul className={styles.list}>
                {visible.map((deck) => (
                  <li key={deck.id}>
                    <DeckRow
                      deck={deck}
                      title={localized(deck.title, lang)}
                      expiry={formatDate(deck.approvedUntil)}
                      days={daysUntil(deck.approvedUntil)}
                      expired={isExpired(deck.approvedUntil)}
                      expiring={isExpiring(deck.approvedUntil, EXPIRING_WITHIN_DAYS)}
                      last={recent.find((session) => session.deckId === deck.id)}
                      onPresent={() => navigate(`/clm/${deck.id}`)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <section className={styles.log} aria-label={t('clm.loop.title')}>
            <header className={styles.logHead}>
              <h2>{t('clm.loop.title')}</h2>
            </header>
            {days.length === 0 ? (
              <p className={styles.empty}>{t('common.empty')}</p>
            ) : (
              <div className={styles.logBody}>
                {days.map((day) => (
                  <section key={day.key}>
                    <h3 className={styles.day}>{formatDate(day.sessions[0].endedAt)}</h3>
                    <ol className={styles.rail}>
                      {day.sessions.map((session) => {
                        const deck = deckById.get(session.deckId)
                        const total = deck?.slides.length ?? session.slides.length
                        return (
                          <li key={session.id} className={styles.visit}>
                            <details>
                              <summary className={styles.summary}>
                                <time dateTime={session.endedAt}>{formatTime(session.endedAt)}</time>
                                <span className={styles.summaryCopy}>
                                  <span className={styles.customer}>{session.customerName}</span>
                                  <span className={styles.summaryMeta}>
                                    {deck ? localized(deck.title, lang) : session.deckId}
                                    {' · '}
                                    {t('clm.loop.slides', { seen: session.slides.length, total })}
                                    {session.followUp ? ` · ${t('clm.followUp')}` : ''}
                                  </span>
                                  <span className={styles.summaryMeta}>
                                    {t('clm.review.by', { name: session.repName })}
                                    {' · '}
                                    {formatClock(secondsBetween(session.startedAt, session.endedAt))}
                                  </span>
                                </span>
                                <i className={`bi bi-chevron-right ${styles.chevron}`} aria-hidden="true" />
                              </summary>
                              <VisitLog session={session} deck={deck} />
                            </details>
                          </li>
                        )
                      })}
                    </ol>
                  </section>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  )
}

function groupByDay(sessions: ClmSession[]) {
  const groups: { key: string; sessions: ClmSession[] }[] = []
  for (const session of sessions) {
    const key = session.endedAt.slice(0, 10)
    const last = groups.at(-1)
    if (last?.key === key) last.sessions.push(session)
    else groups.push({ key, sessions: [session] })
  }
  return groups
}

function secondsBetween(start: string, end: string) {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000))
}

function slideTitle(deck: ClmDeck | undefined, slideId: string, lang: string | undefined) {
  const slide = deck?.slides.find((item) => item.id === slideId)
  return slide ? localized(slide.title, lang) : slideId
}

function VisitLog({ session, deck }: { session: ClmSession; deck: ClmDeck | undefined }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage
  const shown = new Set(session.slides.map((slide) => slide.slideId))
  const missed = deck?.slides.filter((slide) => !shown.has(slide.id)) ?? []

  return (
    <ol className={styles.timeline}>
      {session.slides.map((view) => (
        <SlideEvent key={view.slideId} view={view} title={slideTitle(deck, view.slideId, lang)} />
      ))}
      {(session.note || session.followUp) && (
        <li className={styles.event} data-kind="close">
          {session.note ? (
            <details className={styles.note}>
              <summary>
                <i className={`bi bi-chevron-right ${styles.chevron}`} aria-hidden="true" />
                {t('clm.review.closeNote')}
                {session.followUp ? ` · ${t('clm.followUp')}` : ''}
              </summary>
              <p>{session.note}</p>
            </details>
          ) : (
            <p className={styles.eventTitle}>{t('clm.followUp')}</p>
          )}
        </li>
      )}
      {missed.length > 0 && (
        <li className={styles.event} data-kind="missed">
          <details className={styles.note}>
            <summary>
              <i className={`bi bi-chevron-right ${styles.chevron}`} aria-hidden="true" />
              {t('clm.review.notReached')} · {missed.length}
            </summary>
            <ul className={styles.missed}>
              {missed.map((slide) => (
                <li key={slide.id}>{localized(slide.title, lang)}</li>
              ))}
            </ul>
          </details>
        </li>
      )}
    </ol>
  )
}

function SlideEvent({ view, title }: { view: ClmSlideView; title: string }) {
  const { t } = useTranslation()

  return (
    <li className={styles.event} data-reaction={view.reaction ?? 'neutral'}>
      <p className={styles.eventHead}>
        <span className={styles.dwell}>{formatClock(view.seconds)}</span>
        {view.reaction && <span className={styles.reaction}>{t(`clm.reaction.${view.reaction}`)}</span>}
      </p>
      <p className={styles.eventTitle}>{title}</p>
      {view.feedback && (
        <details className={styles.note}>
          <summary>
            <i className={`bi bi-chevron-right ${styles.chevron}`} aria-hidden="true" />
            {t('clm.review.said')}
          </summary>
          <p>{view.feedback}</p>
        </details>
      )}
    </li>
  )
}

function DeckRow({
  deck,
  title,
  expiry,
  days,
  expired,
  expiring,
  last,
  onPresent,
}: {
  deck: ClmDeck
  title: string
  expiry: string
  days: number
  expired: boolean
  expiring: boolean
  last?: { slides: { slideId: string }[] }
  onPresent: () => void
}) {
  const { t } = useTranslation()

  return (
    <article className={styles.row}>
      <img className={styles.thumb} src={deck.image} alt="" />
      <div className={styles.copy}>
        <h2 className={styles.product}>{deck.productName}</h2>
        <p className={styles.deckTitle}>{title}</p>
        <ul className={styles.meta}>
          <li>
            <code>{deck.code}</code>
          </li>
          <li>{t(`clm.audience.${deck.audience}`)}</li>
          <li>{t('clm.slides', { count: deck.slides.length })}</li>
          <li className={expired ? styles.bad : expiring ? styles.soon : undefined}>
            {expired ? t('clm.expired') : expiring ? t('clm.expiring', { days }) : t('clm.until', { date: expiry })}
          </li>
          <li>{last ? t('clm.lastShown', { seen: last.slides.length, total: deck.slides.length }) : t('clm.neverShown')}</li>
        </ul>
      </div>
      <button type="button" className={styles.present} disabled={expired} onClick={onPresent}>
        {t('clm.present')}
      </button>
    </article>
  )
}
