import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { customerTypes, useCustomers, type CustomerType } from '@/features/customers'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { useWatchPosition } from '@/shared/hooks/useGeolocation'
import { distanceInMeters, hasCoordinates } from '@/shared/lib/geo'
import { PageHeader, SearchInput } from '@/shared/ui'
import { CustomerMap } from '../components/CustomerMap'
import { CustomerMapCard } from '../components/CustomerMapCard'
import { customerTypeStyle } from '../lib/customerTypeStyle'
import styles from './MapPage.module.css'

export function MapPage() {
  const { t } = useTranslation()
  const { formatDistance } = useFormatters()
  const { data, isLoading, error } = useCustomers()
  const [search, setSearch] = useState('')
  const [type, setType] = useState<CustomerType | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const geo = useWatchPosition(locating)
  const term = useDebounce(search).trim().toLowerCase()

  const mapped = data?.filter(hasCoordinates) ?? []
  const unmappedCount = (data?.length ?? 0) - mapped.length
  const matching = mapped.filter((c) =>
    [c.name, c.contactPerson, c.address, c.city].some((field) => field.toLowerCase().includes(term)),
  )
  const visible = matching.filter((c) => !type || c.type === type)

  const distances =
    geo.status === 'ready' ? new Map(visible.map((c) => [c.id, distanceInMeters(geo.position, c)])) : undefined
  const listed = visible.toSorted((a, b) =>
    distances ? distances.get(a.id)! - distances.get(b.id)! : a.name.localeCompare(b.name),
  )
  const selected = visible.find((c) => c.id === selectedId) ?? null

  const chips: { value: CustomerType | null; label: string; count: number; className?: string }[] = [
    { value: null, label: t('map.all'), count: matching.length },
    ...customerTypes.map((value) => ({
      value,
      label: t(`customers.types.${value}`),
      count: matching.filter((c) => c.type === value).length,
      className: styles[customerTypeStyle[value].className],
    })),
  ]

  return (
    <section className={styles.page}>
      <PageHeader
        title={t('map.title')}
        subtitle={t('map.subtitle')}
        actions={<SearchInput value={search} onChange={setSearch} placeholder={t('customers.searchPlaceholder')} />}
      />

      <div className={styles.filters} role="group" aria-label={t('customers.columns.type')}>
        {chips.map((chip) => (
          <button
            key={chip.value ?? 'all'}
            type="button"
            className={`btn ${styles.chip}${type === chip.value ? ' active' : ''}`}
            aria-pressed={type === chip.value}
            onClick={() => setType(chip.value)}
          >
            {chip.className && <span className={`${styles.dot} ${chip.className}`} aria-hidden="true" />}
            {chip.label}
            <span className={styles.count}>{chip.count}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {t('common.error', { message: error.message })}
        </div>
      )}

      <div className={styles.body}>
        <aside className={`card ${styles.panel}`} aria-label={t('map.listLabel')}>
          <div className="card-header bg-body d-flex justify-content-between align-items-baseline py-3">
            <span className="fw-semibold text-body-emphasis">{t('map.onMap', { count: visible.length })}</span>
            {distances && <span className="small text-body-secondary">{t('customers.sort.nearest')}</span>}
          </div>
          <div className={styles.list}>
            {isLoading && (
              <div className="d-flex align-items-center gap-2 p-3 text-body-secondary">
                <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                {t('common.loading')}
              </div>
            )}
            {!isLoading && !listed.length && <p className="p-3 mb-0 text-body-secondary">{t('map.empty')}</p>}
            {listed.map((c) => (
              <button
                key={c.id}
                type="button"
                className={styles.item}
                aria-current={c.id === selectedId}
                onClick={() => setSelectedId(c.id)}
              >
                <span
                  className={`${styles.dot} ${styles[customerTypeStyle[c.type].className]}`}
                  aria-hidden="true"
                />
                <span className={styles.itemText}>
                  <span className={`d-block fw-medium text-body-emphasis ${styles.itemName}`}>{c.name}</span>
                  <span className="d-block small text-body-secondary">
                    {c.address}, {c.city}
                  </span>
                </span>
                {distances && <span className={styles.distance}>{formatDistance(distances.get(c.id)!)}</span>}
              </button>
            ))}
          </div>
          {unmappedCount > 0 && (
            <div className="card-footer bg-body small text-body-secondary">
              <i className="bi bi-info-circle me-2" aria-hidden="true" />
              {t('map.noLocation', { count: unmappedCount })}
            </div>
          )}
        </aside>

        <div className={styles.mapArea}>
          <CustomerMap
            customers={visible}
            selectedId={selected?.id ?? null}
            onSelect={setSelectedId}
            geo={geo}
            onLocate={() => setLocating(true)}
            overlay={
              selected && (
                <CustomerMapCard
                  customer={selected}
                  distance={distances?.get(selected.id)}
                  onClose={() => setSelectedId(null)}
                />
              )
            }
          />
        </div>
      </div>
    </section>
  )
}
