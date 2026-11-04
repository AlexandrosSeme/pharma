import { Draggable } from '@fullcalendar/react/interaction'
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Customer } from '@/features/customers'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { customerDragData } from '../lib/activityStyle'
import type { Activity } from '../types'
import styles from './CustomerPlanner.module.css'

type CustomerPlannerProps = {
  customers: Customer[]
  /** Activities of the rep(s) shown, to tell which customers are due for a visit. */
  activities: Activity[]
  onPick: (customer: Customer) => void
  className?: string
}

/** Customers to drag onto the calendar; the ones with nothing planned and the longest wait come first. */
export function CustomerPlanner({ customers, activities, onPick, className = '' }: CustomerPlannerProps) {
  const { t } = useTranslation()
  const { formatDate } = useFormatters()
  const titleId = useId()
  const listRef = useRef<HTMLUListElement>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const draggable = new Draggable(listRef.current!, {
      itemSelector: '[data-customer-id]',
      eventData: (el) => customerDragData(el.dataset.title!),
      longPressDelay: 300,
    })
    return () => draggable.destroy()
  }, [])

  const now = new Date().toISOString()
  const lastVisit = new Map<string, string>()
  const nextVisit = new Map<string, string>()
  for (const a of activities) {
    if (a.type !== 'visit' || !a.customerId) continue
    const id = a.customerId
    if (a.status === 'done' && a.start > (lastVisit.get(id) ?? '')) lastVisit.set(id, a.start)
    if (a.status === 'planned' && a.end >= now && a.start < (nextVisit.get(id) ?? '\uffff')) nextVisit.set(id, a.start)
  }

  const q = query.trim().toLowerCase()
  const shown = customers
    .filter((c) => c.status === 'active')
    .filter((c) => !q || c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q))
    .toSorted(
      (a, b) =>
        Number(nextVisit.has(a.id)) - Number(nextVisit.has(b.id)) ||
        (lastVisit.get(a.id) ?? '').localeCompare(lastVisit.get(b.id) ?? '') ||
        a.name.localeCompare(b.name),
    )

  return (
    <aside className={`${styles.planner} ${className}`} aria-labelledby={titleId}>
      <div>
        <h3 id={titleId} className="h6 mb-1">
          {t('calendar.planner.title')}
        </h3>
        <p className="small text-body-secondary mb-2">{t('calendar.planner.hint')}</p>
        <div className="input-group input-group-sm">
          <span className="input-group-text">
            <i className="bi bi-search" aria-hidden="true" />
          </span>
          <input
            type="search"
            className="form-control"
            placeholder={t('calendar.planner.search')}
            aria-label={t('calendar.planner.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <ul ref={listRef} className={`list-unstyled mb-0 ${styles.list}`}>
        {shown.map((c) => {
          const next = nextVisit.get(c.id)
          const last = lastVisit.get(c.id)
          return (
            <li key={c.id}>
              <button
                type="button"
                className={styles.item}
                data-customer-id={c.id}
                data-title={c.name}
                onClick={() => onPick(c)}
              >
                <i className={`bi bi-grip-vertical ${styles.grip}`} aria-hidden="true" />
                <span className={styles.text}>
                  <span className={styles.name}>{c.name}</span>
                  <span className={styles.meta}>
                    {c.city} ·{' '}
                    {next ? (
                      <span className="text-primary">{t('calendar.planner.planned', { date: formatDate(next) })}</span>
                    ) : last ? (
                      t('calendar.planner.lastVisit', { date: formatDate(last) })
                    ) : (
                      t('calendar.planner.noVisits')
                    )}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
        {shown.length === 0 && <li className="small text-body-secondary p-2">{t('calendar.planner.empty')}</li>}
      </ul>
    </aside>
  )
}
