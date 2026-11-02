import FullCalendar, { type CalendarRef, type EventChangeInfo, type EventInput } from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import interactionPlugin from '@fullcalendar/react/interaction'
import listPlugin from '@fullcalendar/react/list'
import elLocale from '@fullcalendar/react/locales/el'
import classicThemePlugin from '@fullcalendar/react/themes/classic'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/classic/theme.css'
import '@fullcalendar/react/themes/classic/palette.css'
import { useEffect, useRef, useState, type CSSProperties, type Ref, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { activityStyle } from '../lib/activityStyle'
import { usePinchZoom } from '../lib/usePinchZoom'
import { isTimeGrid, pxPerMinute, type CalendarRange, type CalendarView, type ZoomLevel } from '../lib/views'
import type { Activity, ActivityStatus, ActivityType } from '../types'
import styles from './ActivityCalendar.module.css'

type ActivityCalendarProps = {
  ref: Ref<CalendarRef>
  activities: Activity[]
  /** Name the rep on each event, for managers looking at the whole team. */
  showRep: boolean
  initialView: CalendarView
  /** Row size of the day and week views. */
  zoom: ZoomLevel
  weekends: boolean
  onZoom: (direction: 1 | -1) => void
  onRangeChange: (range: CalendarRange) => void
  onSelectSlot: (start: Date, end: Date, allDay: boolean) => void
  /** Something from a `Draggable` list was dropped on the calendar; `el` is the dragged item. */
  onDropItem: (el: HTMLElement, start: Date, allDay: boolean) => void
  onOpen: (id: string) => void
  onReschedule: (id: string, start: Date, end: Date, revert: () => void) => void
}

const hourFormat = { hour: '2-digit', minute: '2-digit', hour12: false } as const
/** Events shorter than this many px show time and title on one line. */
const COMPACT_PX = 34

/** Done and cancelled activities step back to a tint, so the planned ones stand out. */
const tint = (color: string) => `color-mix(in srgb, ${color} 18%, var(--bs-body-bg))`

export function ActivityCalendar({
  ref,
  activities,
  showRep,
  initialView,
  zoom,
  weekends,
  onZoom,
  onRangeChange,
  onSelectSlot,
  onDropItem,
  onOpen,
  onReschedule,
}: ActivityCalendarProps) {
  const { t, i18n } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState(initialView)
  const timeGrid = isTimeGrid(view)
  const scale = pxPerMinute(zoom)
  usePinchZoom(rootRef, timeGrid, onZoom)
  useKeepScrollCenter(rootRef, scale)

  const events: EventInput[] = activities.map((a) => {
    const { color, contrastColor } = activityStyle[a.type]
    const solid = a.status === 'planned' || view === 'listWeek'
    return {
      id: a.id,
      title: a.title,
      start: a.start,
      end: a.end,
      color: solid ? color : tint(color),
      contrastColor: solid ? contrastColor : 'var(--bs-emphasis-color)',
      editable: a.status === 'planned',
      className: a.status === 'planned' ? undefined : styles[a.status],
      extendedProps: { type: a.type, status: a.status, repName: a.repName },
    }
  })

  function reschedule({ event, revert }: EventChangeInfo) {
    if (event.start && event.end) onReschedule(event.id, event.start, event.end, revert)
  }

  return (
    <div ref={rootRef} className={`${styles.calendar} ${timeGrid ? styles.zoomable : ''}`}>
      <FullCalendar
        ref={ref}
        plugins={[classicThemePlugin, dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView={initialView}
        locale={i18n.resolvedLanguage === 'el' ? elLocale : undefined}
        firstDay={1}
        weekends={weekends}
        headerToolbar={false}
        height="100%"
        events={events}
        nowIndicator
        selectable
        selectMirror
        selectLongPressDelay={300}
        eventLongPressDelay={300}
        editable
        dayMaxEvents
        allDaySlot={false}
        slotMinTime="07:00"
        slotMaxTime="22:00"
        scrollTime="08:00"
        slotDuration={zoom.slotMinutes === 30 ? '00:30' : '00:15'}
        snapDuration="00:15"
        slotHeaderInterval="01:00"
        slotMinHeight={zoom.slotHeight}
        slotEventOverlap={false}
        eventMinHeight={16}
        droppable
        drop={({ draggedEl, date, allDay }) => onDropItem(draggedEl, date, allDay)}
        businessHours={{ daysOfWeek: [1, 2, 3, 4, 5], startTime: '08:00', endTime: '18:00' }}
        eventTimeFormat={hourFormat}
        slotHeaderFormat={hourFormat}
        slotLaneClass={({ isMinor }) => (isMinor ? styles.minorSlot : undefined)}
        slotHeaderClass={styles.slotHeader}
        slotHeaderInnerClass={styles.slotHeaderInner}
        views={{
          timeGridWeek: { titleFormat: { year: 'numeric', month: 'short', day: 'numeric' } },
          dayGridMonth: { eventDisplay: 'block' },
        }}
        noEventsContent={t('calendar.noActivities')}
        datesSet={({ view: v }) => {
          setView(v.type as CalendarView)
          onRangeChange({ title: v.title, view: v.type as CalendarView, start: v.activeStart, end: v.activeEnd })
        }}
        select={({ start, end, allDay, view: v }) => {
          v.calendar.unselect()
          onSelectSlot(start, end, allDay)
        }}
        eventClick={({ event, jsEvent }) => {
          jsEvent.preventDefault()
          onOpen(event.id)
        }}
        eventDrop={reschedule}
        eventResize={reschedule}
        eventContent={({ event, timeText, view: v }) => {
          const type = event.extendedProps.type as ActivityType | undefined
          // The placeholder shown while selecting a new slot has no activity yet.
          if (!type) return <div className={`${styles.event} ${styles.compact}`}>{timeText}</div>

          const status = event.extendedProps.status as ActivityStatus | undefined
          const repName = showRep ? (event.extendedProps.repName as string) : undefined
          const isList = v.type.startsWith('list')
          // Planned activities and anything being dragged in are drawn in the full type color.
          const solid = !isList && (status === undefined || status === 'planned')
          const minutes = event.start && event.end ? (event.end.getTime() - event.start.getTime()) / 60_000 : 0
          const compact = !isList && (!v.type.startsWith('timeGrid') || minutes * scale < COMPACT_PX)
          const tooltip = [timeText, event.title, repName].filter(Boolean).join(' · ')
          // The icon already shows the type, so drop a leading "Visit: " to save room.
          const prefix = `${t(`calendar.types.${type}`)}: `
          const title =
            !isList && event.title.toLowerCase().startsWith(prefix.toLowerCase())
              ? event.title.slice(prefix.length)
              : event.title
          return (
            <div
              className={`${styles.event} ${isList ? styles.listEvent : ''} ${compact ? styles.compact : ''} ${solid ? styles.solid : ''}`}
              style={{ '--event-color': activityStyle[type].color } as CSSProperties}
              title={tooltip}
            >
              {isList && <span className={styles.eventTime}>{timeText}</span>}
              <i className={`bi ${activityStyle[type].icon}`} aria-hidden="true" />
              <div className={styles.eventText}>
                {timeText && !isList && <span className={styles.eventTime}>{timeText}</span>}
                <span className={styles.eventTitle}>{title}</span>
                {repName && !compact && <span className={styles.eventRep}>{repName}</span>}
              </div>
              {status === 'done' && (
                <i className={`bi bi-check-circle-fill ${styles.doneIcon}`} aria-label={t('calendar.status.done')} />
              )}
            </div>
          )
        }}
      />
    </div>
  )
}

/** When the rows grow or shrink, keep the time that was in the middle of the view in the middle. */
function useKeepScrollCenter(rootRef: RefObject<HTMLDivElement | null>, scale: number) {
  const scroller = useRef<HTMLElement | null>(null)
  const center = useRef<number | null>(null)
  const lastScale = useRef(scale)

  useEffect(() => {
    const root = rootRef.current!
    function onScroll(e: Event) {
      const el = e.target as HTMLElement
      if (el.scrollHeight <= el.clientHeight) return
      scroller.current = el
      center.current = (el.scrollTop + el.clientHeight / 2) / el.scrollHeight
    }
    root.addEventListener('scroll', onScroll, true)
    return () => root.removeEventListener('scroll', onScroll, true)
  }, [rootRef])

  useEffect(() => {
    if (lastScale.current === scale) return
    lastScale.current = scale
    const el = scroller.current
    const ratio = center.current
    if (!el || ratio === null || !el.isConnected) return
    const frame = requestAnimationFrame(() => {
      el.scrollTop = ratio * el.scrollHeight - el.clientHeight / 2
    })
    return () => cancelAnimationFrame(frame)
  }, [scale])
}
