import type { CalendarRef } from '@fullcalendar/react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth'
import { recordVisible, useScope, useVisibleCustomers } from '@/features/team'
import { usePlanOwner } from '@/features/team/usePlanOwner'
import { useWatchSubtitle } from '@/features/team/useWatchSubtitle'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { googleMaps } from '@/shared/lib/geo'
import { PageHeader } from '@/shared/ui'
import { ActionButtons } from '../components/ActionButtons'
import { ActivityCalendar } from '../components/ActivityCalendar'
import { ActivityDialog, ActivityEditDialog, DropActionDialog } from '../components/ActivityDialog'
import type { ActivityDraft } from '../components/ActivityForm'
import { CalendarToolbar } from '../components/CalendarToolbar'
import { CustomerPlanner } from '../components/CustomerPlanner'
import { addMinutes, defaultStart, isSameDay } from '../lib/dates'
import { calendarViews, DEFAULT_ZOOM, zoomLevels, type CalendarRange, type CalendarView } from '../lib/views'
import { useActivities, useCreateActivity, useUpdateActivity } from '../queries'
import { activityTypes, type ActivityType } from '../types'
import styles from './CalendarPage.module.css'

const VIEW_KEY = 'pharmasales.calendar.view'
const ZOOM_KEY = 'pharmasales.calendar.zoom'
const WEEKENDS_KEY = 'pharmasales.calendar.weekends'
const DEFAULT_MINUTES = 60

function initialView(): CalendarView {
  const stored = localStorage.getItem(VIEW_KEY) as CalendarView | null
  if (stored && calendarViews.includes(stored)) return stored
  return window.matchMedia('(min-width: 768px)').matches ? 'timeGridWeek' : 'listWeek'
}

const clampZoom = (level: number) => Math.min(zoomLevels.length - 1, Math.max(0, level))

function initialZoom() {
  const stored = localStorage.getItem(ZOOM_KEY)
  return stored && Number.isInteger(Number(stored)) ? clampZoom(Number(stored)) : DEFAULT_ZOOM
}

type DialogState = { id: string } | { draft: ActivityDraft } | null

export function CalendarPage() {
  const { t } = useTranslation()
  const { formatDate } = useFormatters()
  const { user } = useAuth()
  const { scopeRole, watched, focus } = useScope()
  const { data: activities, isLoading, error } = useActivities()
  const { data: customers = [] } = useVisibleCustomers()
  const update = useUpdateActivity()
  const calendarRef = useRef<CalendarRef>(null)
  const [startView] = useState(initialView)
  const [range, setRange] = useState<CalendarRange | null>(null)
  const [type, setType] = useState<ActivityType | null>(null)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [zoom, setZoom] = useState(initialZoom)
  const [weekends, setWeekends] = useState(() => localStorage.getItem(WEEKENDS_KEY) === 'true')

  const planOwner = usePlanOwner()
  const watchedIds = new Set(watched.map((member) => member.id))
  // A new plan is filed under the person who is open, not under whoever is signed in.
  const planFor = { repId: planOwner?.id ?? user!.id, repName: planOwner?.name ?? user!.name }

  const forRep = activities?.filter((activity) => recordVisible(activity.repId, focus, scopeRole, watchedIds)) ?? []
  const inRange = range
    ? forRep.filter((a) => new Date(a.start) < range.end && new Date(a.end) > range.start)
    : forRep
  const visible = forRep.filter((a) => !type || a.type === type)

  const counts = Object.fromEntries(
    activityTypes.map((value) => [value, inRange.filter((a) => a.type === value).length]),
  ) as Partial<Record<ActivityType, number>>

  // The day being viewed in Day view, otherwise today; always one person's route.
  const today = new Date()
  const routeDay = range?.view === 'timeGridDay' ? range.start : today
  const routeRep = planFor.repId
  const customerById = new Map(customers.map((c) => [c.id, c]))
  const stops = (activities ?? [])
    .filter(
      (a) =>
        a.repId === routeRep &&
        a.type === 'visit' &&
        a.status === 'planned' &&
        a.customerId &&
        isSameDay(new Date(a.start), routeDay),
    )
    .toSorted((a, b) => a.start.localeCompare(b.start))
    .flatMap((a) => {
      const c = customerById.get(a.customerId!)
      return c ? [`${c.address}, ${c.postalCode} ${c.city}`] : []
    })
  const routeLabel = isSameDay(routeDay, today)
    ? t('calendar.route.today')
    : t('calendar.route.day', { date: formatDate(routeDay.toISOString()) })

  const api = () => calendarRef.current?.getApi()

  function changeView(view: CalendarView) {
    localStorage.setItem(VIEW_KEY, view)
    api()?.changeView(view)
  }

  function changeZoom(direction: 1 | -1) {
    const next = clampZoom(zoom + direction)
    localStorage.setItem(ZOOM_KEY, String(next))
    setZoom(next)
  }

  function changeWeekends(value: boolean) {
    localStorage.setItem(WEEKENDS_KEY, String(value))
    setWeekends(value)
  }

  function openNew(start = defaultStart(), end = addMinutes(start, DEFAULT_MINUTES)) {
    setDialog({ draft: { type: type ?? 'visit', title: '', start, end } })
  }

  /** A day in Month view has no time; plan it at the start of the working day. */
  function atWorkStart(day: Date) {
    const at = new Date(day)
    at.setHours(9, 0, 0, 0)
    return at
  }

  function selectSlot(start: Date, end: Date, allDay: boolean) {
    if (allDay) openNew(atWorkStart(start))
    else openNew(start, end)
  }

  function pickCustomer(customerId: string) {
    setDialog({ drop: { customerId, start: defaultStart() } })
  }

  function dropCustomer(el: HTMLElement, date: Date, allDay: boolean) {
    const customerId = el.dataset.customerId ?? ''
    if (!customerById.has(customerId)) return
    setDialog({ drop: { customerId, start: allDay ? atWorkStart(date) : date } })
  }

  const open = dialog && 'id' in dialog ? activities?.find((a) => a.id === dialog.id) : undefined
  const dropped = dialog && 'drop' in dialog ? customerById.get(dialog.drop.customerId) : undefined
  const closeDialog = () => setDialog(null)

  return (
    <section className={styles.page}>
      <PageHeader
        title={t('calendar.title')}
        subtitle={useWatchSubtitle('calendar')}
        actions={
          <>
            {stops.length > 0 ? (
              <a
                href={googleMaps.route(stops)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-primary text-nowrap"
              >
                <i className="bi bi-signpost-split me-2" aria-hidden="true" />
                {routeLabel}
                <span className="badge text-bg-primary ms-2">{stops.length}</span>
              </a>
            ) : (
              <button
                type="button"
                className="btn btn-outline-primary text-nowrap"
                disabled
                title={t('calendar.route.none')}
              >
                <i className="bi bi-signpost-split me-2" aria-hidden="true" />
                {routeLabel}
              </button>
            )}
            <button type="button" className="btn btn-primary text-nowrap" onClick={() => openNew()}>
              <i className="bi bi-plus-lg me-2" aria-hidden="true" />
              {t('calendar.newActivity')}
            </button>
          </>
        }
      />

      {error && (
        <div className="alert alert-danger" role="alert">
          {t('common.error', { message: error.message })}
        </div>
      )}

      <div className={`card ${styles.card}`}>
        <div className="card-body d-flex flex-column gap-3 p-2 p-sm-3">
          <ActionButtons variant="filter" label={t('calendar.fields.type')} value={type} counts={counts} onChange={setType} />
          <CalendarToolbar
            title={range?.title ?? ''}
            view={range?.view ?? startView}
            onViewChange={changeView}
            onPrev={() => api()?.prev()}
            onToday={() => api()?.today()}
            onNext={() => api()?.next()}
            canZoomIn={zoom < zoomLevels.length - 1}
            canZoomOut={zoom > 0}
            onZoom={changeZoom}
            weekends={weekends}
            onWeekendsChange={changeWeekends}
          />
          <div className={styles.workspace}>
            {(range?.view ?? startView) !== 'listWeek' && (
              <CustomerPlanner
                className="d-none d-lg-flex"
                customers={customers}
                activities={forRep}
                onPick={(c) => pickCustomer(c.id)}
              />
            )}
            <div className={styles.calendarArea} aria-busy={isLoading}>
              <ActivityCalendar
                ref={calendarRef}
                activities={visible}
                showRep={watched.length > 1}
                initialView={startView}
                zoom={zoomLevels[zoom]}
                weekends={weekends}
                onZoom={changeZoom}
                onRangeChange={setRange}
                onSelectSlot={selectSlot}
                onDropItem={dropCustomer}
                onOpen={(id) => setDialog({ id })}
                onReschedule={(id, start, end, revert) =>
                  update.mutate(
                    { id, data: { start: start.toISOString(), end: end.toISOString() } },
                    { onError: revert },
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>

      {open && <ActivityDialog key={open.id} activity={open} customers={customers} onClose={closeDialog} />}
      {dialog && 'draft' in dialog && (
        <ActivityEditDialog draft={dialog.draft} owner={planFor} customers={customers} onClose={closeDialog} />
      )}
      {dialog && 'drop' in dialog && dropped && (
        <DropActionDialog customer={dropped} start={dialog.drop.start} owner={planFor} onClose={closeDialog} />
      )}
    </section>
  )
}
