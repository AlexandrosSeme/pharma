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

/** How long each action occupies when it is dropped onto a time. */
export const actionMinutes: Record<ActivityType, number> = {
  visit: VISIT_MINUTES,
  call: 30,
  meeting: 60,
  task: 30,
}

/** Ghost shown while a customer is dragged. The action is chosen after the drop. */
export const customerDragData = (title: string) => ({
  title,
  duration: { minutes: VISIT_MINUTES },
  create: false,
  color: 'var(--app-chart-2)',
  contrastColor: 'var(--app-on-activity)',
})
