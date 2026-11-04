import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useScope, useVisibleCustomers } from '@/features/team'
import { useWatchSubtitle } from '@/features/team/useWatchSubtitle'
import { PageHeader, Select } from '@/shared/ui'
import { OrdersTable } from '../components/OrdersTable'
import { useOrderRows } from '../queries'
import { orderStatuses } from '../types'

export function OrdersPage() {
  const { t } = useTranslation()
  const { scopeRole } = useScope()
  const customers = useVisibleCustomers()
  const { rows, isLoading, error } = useOrderRows()
  const [status, setStatus] = useState('')
  const accountIds = new Set((customers.data ?? []).map((customer) => customer.id))
  const waiting = isLoading || customers.isLoading
  const scoped = waiting ? undefined : rows?.filter((order) => scopeRole === 'director' || accountIds.has(order.customerId))

  const filtered = scoped?.filter((o) => !status || o.status === status)

  return (
    <section>
      <PageHeader
        title={t('orders.title')}
        subtitle={useWatchSubtitle('orders')}
        actions={
          <Select
            aria-label={t('orders.columns.status')}
            value={status}
            onChange={setStatus}
            options={[
              { value: '', label: t('orders.allStatuses') },
              ...orderStatuses.map((value) => ({ value, label: t(`orders.status.${value}`) })),
            ]}
          />
        }
      />
      <OrdersTable orders={filtered} isLoading={waiting} error={error ?? customers.error} />
    </section>
  )
}
