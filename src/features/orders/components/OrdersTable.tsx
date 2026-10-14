import { useTranslation } from 'react-i18next'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { DataTable, type Column } from '@/shared/ui'
import type { OrderRow } from '../types'
import { OrderStatusBadge } from './OrderStatusBadge'

type OrdersTableProps = {
  orders: OrderRow[] | undefined
  isLoading?: boolean
  error?: Error | null
}

export function OrdersTable({ orders, isLoading, error }: OrdersTableProps) {
  const { t } = useTranslation()
  const { formatDate, formatMoney } = useFormatters()

  const columns: Column<OrderRow>[] = [
    { key: 'number', header: t('orders.columns.number'), render: (o) => o.orderNumber },
    { key: 'date', header: t('orders.columns.date'), render: (o) => formatDate(o.orderDate) },
    { key: 'customer', header: t('orders.columns.customer'), render: (o) => o.customerName },
    { key: 'items', header: t('orders.columns.items'), render: (o) => o.items.length, align: 'right' },
    { key: 'total', header: t('orders.columns.total'), render: (o) => formatMoney(o.total), align: 'right' },
    { key: 'status', header: t('orders.columns.status'), render: (o) => <OrderStatusBadge status={o.status} /> },
  ]

  return <DataTable columns={columns} rows={orders} isLoading={isLoading} error={error} />
}
