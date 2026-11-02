export const activityTypes = ['visit', 'call', 'meeting', 'task'] as const
export type ActivityType = (typeof activityTypes)[number]

export const activityStatuses = ['planned', 'done', 'cancelled'] as const
export type ActivityStatus = (typeof activityStatuses)[number]

export type Activity = {
  id: string
  type: ActivityType
  title: string
  /** Required for visits; optional for calls, meetings and tasks. */
  customerId?: string
  repId: string
  repName: string
  /** ISO date-times. */
  start: string
  end: string
  status: ActivityStatus
  notes?: string
  /** The GPS check-in that completed this visit. */
  visitId?: string
}

export type NewActivity = Omit<Activity, 'id'>
export type ActivityUpdate = Partial<NewActivity>
