import { useTranslation } from 'react-i18next'
import { CheckInButton } from '@/features/visits'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { googleMaps } from '@/shared/lib/geo'
import { DataTable, StatusBadge, type Column } from '@/shared/ui'
import type { Customer } from '../types'

type CustomersTableProps = {
  customers: Customer[] | undefined
  /** Straight-line meters from the rep, keyed by customer id. */
  distances?: Map<string, number>
  isLoading?: boolean
  error?: Error | null
}

const fullAddress = (c: Customer) => `${c.address}, ${c.postalCode} ${c.city}`

export function CustomersTable({ customers, distances, isLoading, error }: CustomersTableProps) {
  const { t } = useTranslation()
  const { formatDate, formatDistance } = useFormatters()

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: t('customers.columns.name'),
      render: (c) => (
        <>
          <div>{c.name}</div>
          <div className="small fw-normal text-body-secondary">{t(`customers.types.${c.type}`)}</div>
        </>
      ),
    },
    {
      key: 'contact',
      header: t('customers.columns.contact'),
      render: (c) => (
        <>
          <div>{c.contactPerson}</div>
          <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="d-block text-decoration-none text-nowrap">
            <i className="bi bi-telephone-fill me-2" aria-hidden="true" />
            {c.phone}
          </a>
          <div className="small text-body-secondary">{c.email}</div>
        </>
      ),
    },
    {
      key: 'address',
      header: t('customers.columns.address'),
      render: (c) => {
        const distance = distances?.get(c.id)
        return (
          <a
            href={googleMaps.directions(fullAddress(c))}
            target="_blank"
            rel="noopener noreferrer"
            className="d-inline-flex gap-2 text-start text-decoration-none"
            title={t('customers.navigate')}
          >
            <i className="bi bi-geo-alt-fill" aria-hidden="true" />
            <span>
              <span className="d-block">{c.address}</span>
              <span className="d-block small text-body-secondary">
                {c.postalCode} {c.city}
              </span>
              {distance !== undefined && (
                <span className="d-block small fw-semibold text-body-emphasis">
                  {t('customers.distanceAway', { distance: formatDistance(distance) })}
                </span>
              )}
            </span>
          </a>
        )
      },
    },
    {
      key: 'since',
      header: t('customers.columns.since'),
      render: (c) => formatDate(c.createdAt),
      mobile: 'hidden',
      tableClassName: 'd-none d-xxl-table-cell',
    },
    {
      key: 'status',
      header: t('customers.columns.status'),
      render: (c) => (
        <StatusBadge tone={c.status === 'active' ? 'success' : 'danger'}>
          {t(`customers.status.${c.status}`)}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: t('customers.columns.actions'),
      mobile: 'footer',
      render: (c) => (
        <div className="d-flex align-items-start gap-2">
          <a
            href={googleMaps.directions(fullAddress(c))}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-primary flex-fill text-nowrap d-xl-none"
          >
            <i className="bi bi-sign-turn-right me-2" aria-hidden="true" />
            {t('customers.directions')}
          </a>
          <CheckInButton customer={c} className="flex-fill" />
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={customers}
      isLoading={isLoading}
      error={error}
      cardsBelow="xl"
    />
  )
}
