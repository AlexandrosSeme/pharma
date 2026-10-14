import type { BadgeTone } from '@/shared/ui'
import type { LeadStatus } from './types'

export const leadStatusTone: Record<LeadStatus, BadgeTone> = {
  new: 'neutral',
  contacted: 'info',
  qualified: 'accent',
  proposal: 'warning',
  lost: 'danger',
}
