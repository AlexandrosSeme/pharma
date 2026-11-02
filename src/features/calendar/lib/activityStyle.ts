import type { ActivityType } from '../types'

type ActivityStyle = {
  icon: string
  color: string
  /** Text on `color`; amber needs dark text for WCAG AA contrast. */
  contrastColor: string
}

export const activityStyle: Record<ActivityType, ActivityStyle> = {
  visit: { icon: 'bi-geo-alt-fill', color: 'var(--app-activity-visit)', contrastColor: 'var(--app-on-activity)' },
  call: { icon: 'bi-telephone-fill', color: 'var(--app-activity-call)', contrastColor: 'var(--app-on-activity)' },
  meeting: { icon: 'bi-people-fill', color: 'var(--app-activity-meeting)', contrastColor: 'var(--app-on-activity)' },
  task: { icon: 'bi-check2-square', color: 'var(--app-activity-task)', contrastColor: 'var(--app-on-activity-task)' },
}

/** Length of a visit planned by dropping a customer on the calendar. */
export const VISIT_MINUTES = 45

/** Event data for a customer dragged onto the calendar: shows a solid visit while dragging. */
export const visitDragData = (title: string) => ({
  title,
  duration: { minutes: VISIT_MINUTES },
  create: false,
  color: activityStyle.visit.color,
  contrastColor: activityStyle.visit.contrastColor,
  extendedProps: { type: 'visit' },
})
