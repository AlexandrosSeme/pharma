import { useTranslation } from 'react-i18next'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { DataTable, type Column } from '@/shared/ui'
import type { Lead } from '../types'
import { LeadStatusBadge } from './LeadStatusBadge'

type LeadsTableProps = {
  leads: Lead[] | undefined
  isLoading?: boolean
  error?: Error | null
}

export function LeadsTable({ leads, isLoading, error }: LeadsTableProps) {
  const { t } = useTranslation()
  const { formatDate, formatMoney } = useFormatters()

  const columns: Column<Lead>[] = [
    { key: 'company', header: t('leads.columns.company'), render: (l) => l.companyName },
    {
      key: 'contact',
      header: t('leads.columns.contact'),
      render: (l) => (
        <>
          <div>{l.contactPerson}</div>
          <div className="small text-body-secondary">{l.email}</div>
        </>
      ),
    },
    { key: 'city', header: t('leads.columns.city'), render: (l) => l.city },
    { key: 'source', header: t('leads.columns.source'), render: (l) => l.source },
    {
      key: 'value',
      header: t('leads.columns.value'),
      render: (l) => formatMoney(l.estimatedValue),
      align: 'right',
    },
    { key: 'created', header: t('leads.columns.created'), render: (l) => formatDate(l.createdAt) },
    { key: 'status', header: t('leads.columns.status'), render: (l) => <LeadStatusBadge status={l.status} /> },
  ]

  return <DataTable columns={columns} rows={leads} isLoading={isLoading} error={error} />
}
