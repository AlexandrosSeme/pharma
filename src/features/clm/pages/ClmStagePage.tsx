import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth'
import { useCustomers, type Customer } from '@/features/customers'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { Dialog, SearchInput, StatusBadge } from '@/shared/ui'
import { SlideCanvas } from '../components/SlideCanvas'
import { formatClock, localized } from '../lib/text'
import { useClmDeck, useCreateClmSession } from '../queries'
import { slideReactions, type SlideReaction } from '../types'
import styles from './ClmStage.module.css'

type StepNote = {
  reaction: SlideReaction | null
  feedback: string
}

const emptyStep = (): StepNote => ({ reaction: null, feedback: '' })

export function ClmStagePage() {
  const { t, i18n } = useTranslation()
  const { deckId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const deckQuery = useClmDeck(deckId)
  const customers = useCustomers()
  const createSession = useCreateClmSession()
  const deck = deckQuery.data
  const lang = i18n.resolvedLanguage

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [query, setQuery] = useState('')
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [audience, setAudience] = useState(false)
  const [dwell, setDwell] = useState<Record<string, number>>({})
  const [steps, setSteps] = useState<Record<string, StepNote>>({})
  const [blocked, setBlocked] = useState(false)
  const [ending, setEnding] = useState(false)
  const [followUp, setFollowUp] = useState(false)
  const [note, setNote] = useState('')
  const startedAt = useRef<string>('')
  const term = useDebounce(query).trim().toLowerCase()

  const slide = deck?.slides[index]
  const shownSeconds = Object.values(dwell).reduce((sum, value) => sum + value, 0)
  const current = slide ? (steps[slide.id] ?? emptyStep()) : emptyStep()

  const matches = useMemo(() => {
    return (customers.data ?? [])
      .filter((item) => item.status === 'active')
      .filter((item) =>
        [item.name, item.city, item.contactPerson, item.type].join(' ').toLowerCase().includes(term),
      )
      .slice(0, 8)
  }, [customers.data, term])

  function ready(id: string) {
    const step = steps[id]
    return Boolean(step?.reaction && step.feedback.trim())
  }

  function patchStep(id: string, patch: Partial<StepNote>) {
    setSteps((prev) => ({ ...prev, [id]: { ...emptyStep(), ...prev[id], ...patch } }))
    setBlocked(false)
  }

  function tryGo(next: number) {
    if (!deck || !slide || next === index || next < 0 || next >= deck.slides.length) return
    if (next > index && !ready(slide.id)) {
      setBlocked(true)
      return
    }
    setBlocked(false)
    setIndex(next)
  }

  function finish() {
    if (!slide || !ready(slide.id)) {
      setBlocked(true)
      return
    }
    setEnding(true)
  }

  useEffect(() => {
    if (!started || !slide || ending) return
    setDwell((prev) => (slide.id in prev ? prev : { ...prev, [slide.id]: 0 }))
    setSteps((prev) => (prev[slide.id] ? prev : { ...prev, [slide.id]: emptyStep() }))
    const timer = window.setInterval(() => {
      setDwell((prev) => ({ ...prev, [slide.id]: (prev[slide.id] ?? 0) + 1 }))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [started, slide, ending])

  useEffect(() => {
    if (!started || ending || !deck) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return
      if (event.key === 'ArrowRight') tryGo(Math.min(deck.slides.length - 1, index + 1))
      if (event.key === 'ArrowLeft') tryGo(Math.max(0, index - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started, ending, deck, index, steps])

  function begin() {
    if (!customer) return
    startedAt.current = new Date().toISOString()
    setStarted(true)
  }

  const shown = deck?.slides.filter((item) => item.id in dwell) ?? []
  const canSave = note.trim().length > 0 && shown.every((item) => ready(item.id))

  async function save() {
    if (!deck || !customer || !canSave) return
    await createSession.mutateAsync({
      deckId: deck.id,
      customerId: customer.id,
      customerName: customer.name,
      repName: user?.name ?? t('clm.rep'),
      startedAt: startedAt.current,
      endedAt: new Date().toISOString(),
      slides: shown.map((item) => ({
        slideId: item.id,
        seconds: dwell[item.id] ?? 0,
        reaction: steps[item.id]?.reaction ?? undefined,
        feedback: steps[item.id]?.feedback.trim() ?? '',
      })),
      followUp,
      note: note.trim(),
    })
    navigate('/clm')
  }

  if (deckQuery.isLoading) {
    return <p className="text-body-secondary">{t('common.loading')}</p>
  }
  if (deckQuery.error || !deck || !slide) {
    return (
      <div className="alert alert-danger" role="alert">
        {t('common.error', { message: deckQuery.error?.message ?? t('clm.missing') })}
      </div>
    )
  }

  return (
    <section className={styles.stage} data-audience={audience || undefined}>
      <header className={styles.bar}>
        <button type="button" className="btn btn-sm btn-outline-light" onClick={() => navigate('/clm')}>
          {t('clm.back')}
        </button>
        <div className={styles.identity}>
          <p className={styles.who}>{customer ? customer.name : deck.productName}</p>
          <p className={styles.name}>{localized(deck.title, lang)}</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className={styles.clock}>{formatClock(shownSeconds)}</span>
          {started && (
            <button
              type="button"
              className={`btn btn-sm ${audience ? 'btn-light' : 'btn-outline-light'}`}
              aria-pressed={audience}
              onClick={() => setAudience((value) => !value)}
            >
              {t(audience ? 'clm.audienceOn' : 'clm.audienceOff')}
            </button>
          )}
        </div>
      </header>

      {!started ? (
        <div className={styles.gate}>
          <div className={styles.gateCard}>
            <img className={styles.gatePack} src={deck.image} alt={deck.productName} />
            <p className="small text-primary fw-bold text-uppercase mb-0">{deck.code}</p>
            <h1 className={styles.gateTitle}>{t('clm.gate.title')}</h1>
            <p className="text-body-secondary mt-2 mb-3">{t('clm.gate.hint')}</p>
            <SearchInput value={query} onChange={setQuery} placeholder={t('clm.gate.search')} />
            <ul className={styles.results}>
              {matches.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={styles.person}
                    aria-pressed={customer?.id === item.id}
                    onClick={() => setCustomer(item)}
                  >
                    <StatusBadge tone="info">{t(`customers.types.${item.type}`)}</StatusBadge>
                    <span>
                      <strong>{item.name}</strong>
                      <span>
                        {item.contactPerson} · {item.city}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-primary mt-3" disabled={!customer} onClick={begin}>
              {t('clm.gate.start')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.workspace}>
            <aside className={styles.notes}>
              <p className={styles.notesLabel}>{t('clm.notes')}</p>
              <p>{localized(slide.note, lang)}</p>
              <p className={styles.notesLabel}>{t('clm.reaction.label')}</p>
              <div className={styles.reactions} role="radiogroup" aria-label={t('clm.reaction.label')}>
                {slideReactions.map((reaction) => (
                  <button
                    key={reaction}
                    type="button"
                    className={styles.reaction}
                    role="radio"
                    aria-checked={current.reaction === reaction}
                    aria-pressed={current.reaction === reaction}
                    onClick={() => patchStep(slide.id, { reaction })}
                  >
                    {t(`clm.reaction.${reaction}`)}
                  </button>
                ))}
              </div>
              <label className="mb-0">
                <span className={styles.notesLabel}>{t('clm.reaction.note')}</span>
                <input
                  className={styles.stepNote}
                  value={current.feedback}
                  placeholder={t('clm.reaction.notePlaceholder')}
                  onChange={(event) => patchStep(slide.id, { feedback: event.target.value })}
                />
              </label>
              {blocked && !ready(slide.id) && <p className={styles.hint}>{t('clm.reaction.required')}</p>}
            </aside>
            <div className={styles.canvas}>
              <SlideCanvas deck={deck} slide={slide} index={index} />
            </div>
          </div>
          <footer className={styles.tools}>
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              disabled={index === 0}
              onClick={() => tryGo(index - 1)}
            >
              {t('clm.prev')}
            </button>
            <div className={styles.strip} aria-label={t('clm.slidesNav')}>
              {deck.slides.map((item, itemIndex) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.thumb}
                  aria-current={itemIndex === index || undefined}
                  aria-label={localized(item.title, lang)}
                  data-seen={ready(item.id) || undefined}
                  onClick={() => tryGo(itemIndex)}
                >
                  {itemIndex + 1}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              disabled={index === deck.slides.length - 1}
              onClick={() => tryGo(index + 1)}
            >
              {t('clm.next')}
            </button>
            {blocked && !ready(slide.id) && <span className={styles.hint}>{t('clm.reaction.required')}</span>}
            <button type="button" className="btn btn-sm btn-light" onClick={finish}>
              {t('clm.end')}
            </button>
          </footer>
        </>
      )}

      {ending && (
        <Dialog
          title={t('clm.endTitle')}
          onClose={() => setEnding(false)}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setEnding(false)}>
                {t('clm.keep')}
              </button>
              <button type="button" className="btn btn-primary" disabled={!canSave || createSession.isPending} onClick={() => void save()}>
                {t('clm.save')}
              </button>
            </>
          }
        >
          <div className={styles.summary}>
            <p className="mb-1">
              {customer?.name} · {formatClock(shownSeconds)} ·{' '}
              {t('clm.loop.slides', { seen: shown.length, total: deck.slides.length })}
            </p>
            {shown.map((item) => {
              const step = steps[item.id] ?? emptyStep()
              const seconds = dwell[item.id] ?? 0
              const width = shownSeconds ? Math.max(8, Math.round((seconds / shownSeconds) * 100)) : 0
              return (
                <div key={item.id} className={styles.row}>
                  <span>{localized(item.title, lang)}</span>
                  <strong>
                    {step.reaction ? t(`clm.reaction.${step.reaction}`) : '—'} · {formatClock(seconds)}
                  </strong>
                  <div className={styles.track} aria-hidden="true">
                    <span style={{ width: `${width}%` }} />
                  </div>
                  <input
                    className={`form-control form-control-sm ${styles.summaryInput}`}
                    value={step.feedback}
                    aria-label={t('clm.reaction.note')}
                    onChange={(event) => patchStep(item.id, { feedback: event.target.value })}
                  />
                </div>
              )
            })}
            <label className="form-check mt-2">
              <input
                className="form-check-input"
                type="checkbox"
                checked={followUp}
                onChange={(event) => setFollowUp(event.target.checked)}
              />
              <span className="form-check-label">{t('clm.followUpAsk')}</span>
            </label>
            <textarea
              className="form-control"
              rows={3}
              value={note}
              placeholder={t('clm.notePlaceholder')}
              onChange={(event) => setNote(event.target.value)}
            />
            {!note.trim() && <p className="small text-warning-emphasis mb-0">{t('clm.closeRequired')}</p>}
            {createSession.error && (
              <div className="alert alert-danger mb-0" role="alert">
                {t('common.error', { message: createSession.error.message })}
              </div>
            )}
          </div>
        </Dialog>
      )}
    </section>
  )
}
