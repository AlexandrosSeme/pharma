import { useTranslation } from 'react-i18next'
import { StatusBadge } from '@/shared/ui'
import { orderStatusTone } from '../status'
import type { OrderStatus } from '../types'

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation()
  return <StatusBadge tone={orderStatusTone[status]}>{t(`orders.status.${status}`)}</StatusBadge>
}
