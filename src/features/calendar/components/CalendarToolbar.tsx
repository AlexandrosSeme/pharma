import { useTranslation } from 'react-i18next'
import { calendarViews, isTimeGrid, type CalendarView } from '../lib/views'
import styles from './CalendarToolbar.module.css'

type CalendarToolbarProps = {
  title: string
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  onPrev: () => void
  onToday: () => void
  onNext: () => void
  canZoomIn: boolean
  canZoomOut: boolean
  onZoom: (direction: 1 | -1) => void
  weekends: boolean
  onWeekendsChange: (weekends: boolean) => void
}

const viewIcons: Record<CalendarView, string> = {
  timeGridDay: 'bi-calendar-day',
  timeGridWeek: 'bi-calendar-week',
  dayGridMonth: 'bi-calendar3',
  listWeek: 'bi-list-ul',
}

export function CalendarToolbar({
  title,
  view,
  onViewChange,
  onPrev,
  onToday,
  onNext,
  canZoomIn,
  canZoomOut,
  onZoom,
  weekends,
  onWeekendsChange,
}: CalendarToolbarProps) {
  const { t } = useTranslation()
  const zoomable = isTimeGrid(view)

  return (
    <div className={styles.toolbar}>
      <div className={styles.nav}>
        <div className="btn-group" role="group">
          <button type="button" className="btn btn-outline-secondary" onClick={onPrev} aria-label={t('calendar.prev')}>
            <i className="bi bi-chevron-left" aria-hidden="true" />
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={onToday}>
            {t('calendar.today')}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={onNext} aria-label={t('calendar.next')}>
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </button>
        </div>
        <h2 className={`h5 mb-0 ${styles.title}`} aria-live="polite">
          {title}
        </h2>
      </div>

      <div className={styles.controls}>
        <div className={`btn-group ${styles.views}`} role="group" aria-label={t('calendar.view')}>
          {calendarViews.map((v) => (
            <button
              key={v}
              type="button"
              className={`btn ${v === view ? 'btn-primary' : 'btn-outline-secondary'}`}
              aria-pressed={v === view}
              onClick={() => onViewChange(v)}
            >
              <i className={`bi ${viewIcons[v]} me-1 me-sm-2`} aria-hidden="true" />
              <span className={styles.viewLabel}>{t(`calendar.views.${v}`)}</span>
            </button>
          ))}
        </div>

        <div className={styles.tools}>
          {view !== 'timeGridDay' && view !== 'listWeek' && (
            <button
              type="button"
              className={`btn ${weekends ? 'btn-primary' : 'btn-outline-secondary'} text-nowrap`}
              aria-pressed={weekends}
              onClick={() => onWeekendsChange(!weekends)}
            >
              <i className="bi bi-calendar2-range me-2" aria-hidden="true" />
              {t('calendar.weekends')}
            </button>
          )}
          {zoomable && (
            <div className="btn-group" role="group" aria-label={t('calendar.zoom')}>
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={!canZoomOut}
                onClick={() => onZoom(-1)}
                aria-label={t('calendar.zoomOut')}
                title={t('calendar.zoomOut')}
              >
                <i className="bi bi-zoom-out" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={!canZoomIn}
                onClick={() => onZoom(1)}
                aria-label={t('calendar.zoomIn')}
                title={t('calendar.zoomIn')}
              >
                <i className="bi bi-zoom-in" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
