import type { BadgeTone } from '@/shared/ui'
import type { OrderStatus } from './types'

export const orderStatusTone: Record<OrderStatus, BadgeTone> = {
  pending: 'neutral',
  processing: 'warning',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
}
