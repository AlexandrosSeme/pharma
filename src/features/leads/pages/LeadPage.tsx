import { useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { memberById, useVisibleCustomers } from '@/features/team'
import { usePlanOwner } from '@/features/team/usePlanOwner'
import { useScope } from '@/features/team/useScope'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { googleMaps } from '@/shared/lib/geo'
import { useLead, useUpdateLead } from '../queries'
import { arrivedAt, daysSince, leadStory } from '../story'
import { leadStatuses, type Lead, type LeadEvent, type LeadStatus } from '../types'
import styles from './LeadPage.module.css'

const openStages = leadStatuses.filter((status) => status !== 'lost')

const locales: Record<string, string> = { en: 'en-GB', el: 'el-GR' }

function initials(name: string) {
  const words = name.split(/\s+/).filter(Boolean)
  const named = words.filter((word) => !/^\p{L}{1,3}\.$/u.test(word))
  return (named.length ? named : words)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}

function shortWhen(iso: string, locale: string) {
  const date = new Date(iso)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : '2-digit',
  }).format(date)
}

export function LeadPage() {
  const { id = '' } = useParams()
  const { t, i18n } = useTranslation()
  const { formatDate, formatMoney, formatTime } = useFormatters()
  const { scopeRole } = useScope()
  const owner = usePlanOwner()
  const leadQuery = useLead(id)
  const customers = useVisibleCustomers()
  const update = useUpdateLead()
  const [kind, setKind] = useState<'call' | 'note'>('call')
  const [text, setText] = useState('')
  const [followUp, setFollowUp] = useState('')

  const lead = leadQuery.data
  const locale = locales[i18n.resolvedLanguage ?? 'en'] ?? 'en-GB'

  if (leadQuery.isLoading || customers.isLoading) {
    return <p className="text-body-secondary">{t('common.loading')}</p>
  }
  if (leadQuery.error || !lead) {
    return (
      <div className={styles.page}>
        <Back />
        <div className="alert alert-danger" role="alert">
          {t('leads.detail.missing')}
        </div>
      </div>
    )
  }

  const cities = new Set((customers.data ?? []).map((customer) => customer.city))
  if (scopeRole !== 'director' && !cities.has(lead.city)) {
    return (
      <div className={styles.page}>
        <Back />
        <p className="text-body-secondary mb-0">{t('leads.detail.outside')}</p>
      </div>
    )
  }

  const story = leadStory(lead)
  const inCity = (customers.data ?? []).filter((customer) => customer.city === lead.city)
  const nearby = inCity.slice(0, 6)
  const covered =
    scopeRole === 'rep'
      ? ''
      : [...new Set(inCity.flatMap((customer) => (customer.repId ? [memberById(customer.repId)?.name ?? ''] : [])))]
          .filter(Boolean)
          .join(', ')
  const place = googleMaps.place(`${lead.companyName}, ${lead.city}`)
  const round = googleMaps.route([
    ...nearby.map((customer) => `${customer.address}, ${customer.postalCode} ${customer.city}`),
    `${lead.companyName}, ${lead.city}`,
  ])
  const stageIndex = openStages.indexOf(lead.status as (typeof openStages)[number])
  const here = arrivedAt(lead, story)
  const stale = daysSince(lead.createdAt) >= 21 && (lead.status === 'new' || lead.status === 'contacted')
  const phone = lead.phone.replace(/\s/g, '')

  function remember(next: LeadEvent[], patch: Partial<Lead>) {
    update.mutate({ id: lead!.id, data: { events: next, ...patch } })
  }

  function setStatus(status: LeadStatus) {
    if (!lead || status === lead.status || update.isPending) return
    remember(
      [
        ...leadStory(lead),
        {
          id: crypto.randomUUID(),
          kind: 'status',
          status,
          at: new Date().toISOString(),
          by: owner?.name,
        },
      ],
      { status },
    )
  }

  function addToHistory() {
    const said = text.trim()
    if (!lead || !said || update.isPending) return
    const callback = followUp
    update.mutate(
      {
        id: lead.id,
        data: {
          events: [
            ...leadStory(lead),
            {
              id: crypto.randomUUID(),
              kind,
              text: said,
              at: new Date().toISOString(),
              by: owner?.name,
            },
          ],
          notes: said,
          ...(callback ? { followUpAt: callback } : {}),
        },
      },
      {
        onSuccess: () => {
          setText('')
          setFollowUp('')
        },
      },
    )
  }

  function eventTitle(event: LeadEvent) {
    if (event.kind === 'opened') return t('leads.detail.eventOpened')
    if (event.kind === 'call') return t('leads.detail.eventCall')
    if (event.kind === 'note') return t('leads.detail.eventNote')
    return t('leads.detail.eventStatus', {
      status: t(`leads.status.${event.status ?? lead!.status}`),
    })
  }

  return (
    <section className={styles.page}>
      <Back />
      <header className={styles.identity}>
        <h1 className={styles.name}>{lead.companyName}</h1>
        <p className={styles.who}>
          {lead.contactPerson}
          <span aria-hidden="true"> · </span>
          {lead.city}
        </p>
        <p className={styles.facts}>
          <span className={stale ? styles.stale : undefined}>
            {t('leads.detail.days', { count: daysSince(lead.createdAt) })}
          </span>
          {here && daysSince(here) > 0 && (
            <>
              <span aria-hidden="true"> · </span>
              {t('leads.detail.daysHere', { count: daysSince(here) })}
            </>
          )}
          <span aria-hidden="true"> · </span>
          {lead.source}
          <span aria-hidden="true"> · </span>
          {t('leads.detail.potential', { value: formatMoney(lead.estimatedValue) })}
        </p>
      </header>

      <section className={styles.panel} aria-labelledby="lead-progress">
        <div className={styles.panelHead}>
          <h2 id="lead-progress">{t('leads.detail.stage')}</h2>
          <button
            type="button"
            className={styles.textBtn}
            disabled={update.isPending}
            onClick={() => setStatus(lead.status === 'lost' ? 'new' : 'lost')}
          >
            {t(lead.status === 'lost' ? 'leads.detail.reopen' : 'leads.detail.markLost')}
          </button>
        </div>
        <div className={styles.progressBody}>
          <ol
            className={styles.rail}
            style={{ '--progress': lead.status === 'lost' ? 0 : Math.max(0, stageIndex) / 3 } as CSSProperties}
            aria-label={t('leads.detail.stage')}
          >
            {openStages.map((status, index) => {
              const state =
                lead.status === 'lost' ? 'upcoming' : index < stageIndex ? 'done' : index === stageIndex ? 'current' : 'upcoming'
              return (
                <li key={status}>
                  <button
                    type="button"
                    className={styles.step}
                    data-state={state}
                    aria-current={state === 'current' ? 'step' : undefined}
                    disabled={update.isPending}
                    onClick={() => setStatus(status)}
                  >
                    <span className={styles.dot}>{state === 'done' && <i className="bi bi-check-lg" aria-hidden="true" />}</span>
                    <span className={styles.label}>{t(`leads.status.${status}`)}</span>
                  </button>
                </li>
              )
            })}
          </ol>
          <div className={lead.status === 'lost' ? styles.nextLost : styles.next}>
            <i className={`bi ${lead.status === 'lost' ? 'bi-x-circle' : 'bi-arrow-right'}`} aria-hidden="true" />
            <p>
              {lead.status === 'lost' && <strong className={styles.lostTitle}>{t('leads.detail.lostTitle')}. </strong>}
              {t(`leads.detail.next.${lead.status}`)}
            </p>
          </div>
        </div>
      </section>

      <div className={styles.layout}>
        <section className={styles.panel} aria-labelledby="lead-history">
          <div className={styles.panelHead}>
            <h2 id="lead-history">{t('leads.detail.notes')}</h2>
          </div>
          <div className={styles.composer}>
            <div className={styles.kinds} role="group" aria-label={t('leads.detail.logAs')}>
              {(['call', 'note'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={option === kind ? `${styles.kind} ${styles.kindOn}` : styles.kind}
                  data-kind={option}
                  aria-pressed={option === kind}
                  onClick={() => setKind(option)}
                >
                  <span className={styles.kindMark} aria-hidden="true">
                    <i className={`bi ${option === 'call' ? 'bi-telephone' : 'bi-pencil'}`} />
                  </span>
                  {t(option === 'call' ? 'leads.detail.logCall' : 'leads.detail.logNote')}
                </button>
              ))}
            </div>
            <textarea
              className={`form-control ${styles.said}`}
              value={text}
              placeholder={t('leads.detail.notesPlaceholder')}
              rows={2}
              disabled={update.isPending}
              onChange={(event) => setText(event.target.value)}
            />
            <div className={styles.saveRow}>
              <label className={styles.date}>
                {t('leads.detail.callback')}
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={followUp}
                  onChange={(event) => setFollowUp(event.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!text.trim() || update.isPending}
                onClick={addToHistory}
              >
                {t('leads.detail.saveNotes')}
              </button>
            </div>
            {update.isError && <p className={styles.fail}>{t('leads.detail.saveFailed')}</p>}
          </div>

          {lead.followUpAt && (
            <div className={lead.followUpAt < todayKey() ? styles.callbackLate : styles.callback}>
              <i className="bi bi-telephone" aria-hidden="true" />
              <span>
                {t(lead.followUpAt < todayKey() ? 'leads.detail.callbackOverdue' : 'leads.detail.callbackOn', {
                  date: formatDate(`${lead.followUpAt}T12:00:00`),
                })}
              </span>
              <button
                type="button"
                className={styles.textBtn}
                disabled={update.isPending}
                onClick={() => update.mutate({ id: lead.id, data: { followUpAt: '' } })}
              >
                {t('leads.detail.clearCallback')}
              </button>
            </div>
          )}

          <ol className={styles.timeline}>
            {[...story].reverse().map((event) => (
              <li key={event.id} className={styles.event} data-kind={event.kind} data-status={event.status}>
                <div className={styles.when}>
                  <span className={styles.day}>{shortWhen(event.at, locale)}</span>
                  <span className={styles.clock}>{formatTime(event.at)}</span>
                </div>
                <div className={styles.track} aria-hidden="true">
                  <span className={styles.mark} />
                </div>
                <div className={styles.entry}>
                  <p className={styles.eventTitle}>
                    {eventTitle(event)}
                    {event.by && <span className={styles.by}>{event.by}</span>}
                  </p>
                  {event.kind === 'opened' && <p className={styles.entryText}>{t('leads.detail.from', { source: lead.source })}</p>}
                  {event.text && <p className={styles.entryText}>{event.text}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className={styles.side}>
          <section className={styles.panel} aria-labelledby="lead-contact">
            <div className={styles.panelHead}>
              <h2 id="lead-contact">{t('leads.detail.contact')}</h2>
            </div>
            <div className={styles.person}>
              <span className={styles.initials} aria-hidden="true">
                {initials(lead.contactPerson)}
              </span>
              <span>
                <span className={styles.personName}>{lead.contactPerson}</span>
                <span className={styles.personMeta}>{lead.city}</span>
              </span>
            </div>
            <a className={styles.line} href={`tel:${phone}`}>
              <i className="bi bi-telephone" aria-hidden="true" />
              <span className={styles.lineText}>{lead.phone}</span>
              <span className={styles.go}>{t('leads.detail.call')}</span>
            </a>
            <a className={styles.line} href={`mailto:${lead.email}`}>
              <i className="bi bi-envelope" aria-hidden="true" />
              <span className={styles.lineText}>{lead.email}</span>
              <span className={styles.go}>{t('leads.detail.email')}</span>
            </a>
            <a className={styles.line} href={place} target="_blank" rel="noopener noreferrer">
              <i className="bi bi-geo-alt" aria-hidden="true" />
              <span className={styles.lineText}>{lead.city}</span>
              <span className={styles.go}>{t('leads.detail.map')}</span>
            </a>
          </section>

          <section className={styles.panel} aria-labelledby="lead-nearby">
            <div className={styles.panelHead}>
              <h2 id="lead-nearby">{t('leads.detail.nearby', { city: lead.city })}</h2>
            </div>
            {covered && <p className={styles.covered}>{t('leads.detail.covered', { name: covered })}</p>}
            {nearby.length === 0 ? (
              <p className={styles.empty}>{t('leads.detail.nearbyEmpty')}</p>
            ) : (
              <ul className={styles.stops}>
                {nearby.map((customer) => (
                  <li key={customer.id}>
                    <a
                      className={styles.stop}
                      href={googleMaps.directions(`${customer.address}, ${customer.postalCode} ${customer.city}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className={styles.stopName}>{customer.name}</span>
                      <span className={styles.stopMeta}>
                        {t(`customers.types.${customer.type}`)}
                        <span aria-hidden="true"> · </span>
                        {customer.contactPerson}
                      </span>
                      <span className={styles.go}>{t('leads.detail.map')}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {inCity.length > nearby.length && (
              <p className={styles.more}>{t('leads.detail.moreStops', { count: inCity.length - nearby.length })}</p>
            )}
            {nearby.length > 0 && (
              <a className={styles.round} href={round} target="_blank" rel="noopener noreferrer">
                <i className="bi bi-signpost-2" aria-hidden="true" />
                {t('leads.detail.round')}
              </a>
            )}
            <p className={styles.hint}>{t('leads.detail.nearbyHint')}</p>
          </section>
        </div>
      </div>
    </section>
  )
}

function Back() {
  const { t } = useTranslation()
  return (
    <Link to="/leads" className={styles.back}>
      <i className="bi bi-arrow-left" aria-hidden="true" />
      {t('leads.detail.back')}
    </Link>
  )
}

function todayKey() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}
