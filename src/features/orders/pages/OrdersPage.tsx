import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader, Select } from '@/shared/ui'
import { OrdersTable } from '../components/OrdersTable'
import { useOrderRows } from '../queries'
import { orderStatuses } from '../types'

export function OrdersPage() {
  const { t } = useTranslation()
  const { rows, isLoading, error } = useOrderRows()
  const [status, setStatus] = useState('')

  const filtered = rows?.filter((o) => !status || o.status === status)

  return (
    <section>
      <PageHeader
        title={t('orders.title')}
        subtitle={t('orders.subtitle')}
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
      <OrdersTable orders={filtered} isLoading={isLoading} error={error} />
    </section>
  )
}
