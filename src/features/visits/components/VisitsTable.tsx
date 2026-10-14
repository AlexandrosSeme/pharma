import { useTranslation } from 'react-i18next'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { googleMaps } from '@/shared/lib/geo'
import { DataTable, StatusBadge, type Column } from '@/shared/ui'
import { AWAY_FROM_CUSTOMER_M, type VisitRow } from '../types'

type VisitsTableProps = {
  visits: VisitRow[] | undefined
  isLoading?: boolean
  error?: Error | null
}

export function VisitsTable({ visits, isLoading, error }: VisitsTableProps) {
  const { t } = useTranslation()
  const { formatDateTime, formatDistance } = useFormatters()

  const columns: Column<VisitRow>[] = [
    { key: 'customer', header: t('visits.columns.customer'), render: (v) => v.customerName, mobile: 'title' },
    { key: 'date', header: t('visits.columns.date'), render: (v) => formatDateTime(v.checkedInAt) },
    { key: 'rep', header: t('visits.columns.rep'), render: (v) => v.repName },
    {
      key: 'distance',
      header: t('visits.columns.distance'),
      render: (v) =>
        v.distanceToCustomer === undefined ? (
          '—'
        ) : (
          <span className="d-inline-flex flex-wrap align-items-center justify-content-end gap-2">
            {formatDistance(v.distanceToCustomer)}
            {v.distanceToCustomer > AWAY_FROM_CUSTOMER_M && (
              <StatusBadge tone="warning">{t('visits.awayFromCustomer')}</StatusBadge>
            )}
          </span>
        ),
    },
    {
      key: 'location',
      header: t('visits.columns.location'),
      render: (v) => (
        <a
          href={googleMaps.place(v)}
          target="_blank"
          rel="noopener noreferrer"
          className="d-inline-flex align-items-center gap-2 text-decoration-none"
        >
          <i className="bi bi-geo-alt-fill" aria-hidden="true" />
          {t('visits.viewOnMap')}
          <span className="small text-body-secondary">
            {t('visits.accuracy', { distance: formatDistance(v.accuracy) })}
          </span>
        </a>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={visits}
      isLoading={isLoading}
      error={error}
      emptyText={t('visits.empty')}
    />
  )
}
