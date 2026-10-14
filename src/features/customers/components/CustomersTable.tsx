import { useTranslation } from 'react-i18next'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { DataTable, StatusBadge, type Column } from '@/shared/ui'
import type { Customer } from '../types'

type CustomersTableProps = {
  customers: Customer[] | undefined
  isLoading?: boolean
  error?: Error | null
}

export function CustomersTable({ customers, isLoading, error }: CustomersTableProps) {
  const { t } = useTranslation()
  const { formatDate } = useFormatters()

  const columns: Column<Customer>[] = [
    { key: 'name', header: t('customers.columns.name'), render: (c) => c.name },
    { key: 'type', header: t('customers.columns.type'), render: (c) => t(`customers.types.${c.type}`) },
    {
      key: 'contact',
      header: t('customers.columns.contact'),
      render: (c) => (
        <>
          <div>{c.contactPerson}</div>
          <div className="small text-body-secondary">{c.email}</div>
        </>
      ),
    },
    { key: 'phone', header: t('customers.columns.phone'), render: (c) => c.phone },
    { key: 'city', header: t('customers.columns.city'), render: (c) => c.city },
    { key: 'since', header: t('customers.columns.since'), render: (c) => formatDate(c.createdAt) },
    {
      key: 'status',
      header: t('customers.columns.status'),
      render: (c) => (
        <StatusBadge tone={c.status === 'active' ? 'success' : 'danger'}>
          {t(`customers.status.${c.status}`)}
        </StatusBadge>
      ),
    },
  ]

  return <DataTable columns={columns} rows={customers} isLoading={isLoading} error={error} />
}
