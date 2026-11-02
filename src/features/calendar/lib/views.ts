export const calendarViews = ['timeGridDay', 'timeGridWeek', 'dayGridMonth', 'listWeek'] as const
export type CalendarView = (typeof calendarViews)[number]

export type CalendarRange = { title: string; view: CalendarView; start: Date; end: Date }

export const isTimeGrid = (view: CalendarView) => view.startsWith('timeGrid')

export type ZoomLevel = {
  /** Minutes per grid row. Dragging always snaps to 15 minutes. */
  slotMinutes: 15 | 30
  /** Row height in px; the classic theme can't draw rows much under 17px. */
  slotHeight: number
}

/** From the whole working day at a glance to a few hours in detail. */
export const zoomLevels: readonly ZoomLevel[] = [
  { slotMinutes: 30, slotHeight: 17 },
  { slotMinutes: 30, slotHeight: 24 },
  { slotMinutes: 15, slotHeight: 17 },
  { slotMinutes: 15, slotHeight: 24 },
  { slotMinutes: 15, slotHeight: 32 },
  { slotMinutes: 15, slotHeight: 44 },
  { slotMinutes: 15, slotHeight: 60 },
]
export const DEFAULT_ZOOM = 3

export const pxPerMinute = ({ slotMinutes, slotHeight }: ZoomLevel) => slotHeight / slotMinutes
