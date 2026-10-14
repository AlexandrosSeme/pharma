import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useWatchPosition } from '@/shared/hooks/useGeolocation'
import { distanceInMeters, hasCoordinates } from '@/shared/lib/geo'
import { MyLocationButton, PageHeader, SearchInput, Select } from '@/shared/ui'
import { CustomersTable } from '../components/CustomersTable'
import { useCustomers } from '../queries'
import { customerTypes } from '../types'

const sortOrders = ['name', 'nearest'] as const
type SortOrder = (typeof sortOrders)[number]

const SORT_STORAGE_KEY = 'pharmasales.customers.sort'
const loadSort = (): SortOrder => (localStorage.getItem(SORT_STORAGE_KEY) === 'nearest' ? 'nearest' : 'name')

export function CustomersPage() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useCustomers()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [sort, setSort] = useState<SortOrder>(loadSort)
  const term = useDebounce(search).trim().toLowerCase()
  const geo = useWatchPosition(sort === 'nearest')

  function changeSort(value: string) {
    const next = value === 'nearest' ? 'nearest' : 'name'
    localStorage.setItem(SORT_STORAGE_KEY, next)
    setSort(next)
  }

  const distances =
    geo.status === 'ready'
      ? new Map(
          data?.filter(hasCoordinates).map((c) => [c.id, distanceInMeters(geo.position, c)] as const),
        )
      : undefined

  const rows = data
    ?.filter(
      (c) =>
        (!type || c.type === type) &&
        [c.name, c.contactPerson, c.address, c.city].some((field) => field.toLowerCase().includes(term)),
    )
    .toSorted((a, b) => {
      if (distances) {
        const byDistance = (distances.get(a.id) ?? Infinity) - (distances.get(b.id) ?? Infinity)
        if (byDistance) return byDistance
      }
      return a.name.localeCompare(b.name)
    })

  return (
    <section>
      <PageHeader
        title={t('customers.title')}
        subtitle={t('customers.subtitle')}
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder={t('customers.searchPlaceholder')} />
            <div className="d-flex gap-2">
              <Select
                aria-label={t('customers.columns.type')}
                value={type}
                onChange={setType}
                options={[
                  { value: '', label: t('customers.allTypes') },
                  ...customerTypes.map((value) => ({ value, label: t(`customers.types.${value}`) })),
                ]}
              />
              <Select
                aria-label={t('customers.sort.label')}
                value={sort}
                onChange={changeSort}
                options={sortOrders.map((value) => ({ value, label: t(`customers.sort.${value}`) }))}
              />
            </div>
            <MyLocationButton />
          </>
        }
      />
      <div aria-live="polite">
        {geo.status === 'locating' && (
          <p className="d-flex align-items-center gap-2 text-body-secondary">
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            {t('location.locating')}
          </p>
        )}
        {geo.status === 'error' && (
          <div className="alert alert-warning" role="alert">
            {t(`location.errors.${geo.error}`)} {t('customers.sort.fallback')}
          </div>
        )}
      </div>
      <CustomersTable customers={rows} distances={distances} isLoading={isLoading} error={error} />
    </section>
  )
}
