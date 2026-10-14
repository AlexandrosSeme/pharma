import { useTranslation } from 'react-i18next'
import type { Customer } from '@/features/customers'
import { CheckInButton } from '@/features/visits'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { googleMaps } from '@/shared/lib/geo'
import { StatusBadge } from '@/shared/ui'
import { customerTypeStyle } from '../lib/customerTypeStyle'
import styles from './CustomerMapCard.module.css'

type CustomerMapCardProps = {
  customer: Customer
  distance?: number
  onClose: () => void
}

export function CustomerMapCard({ customer: c, distance, onClose }: CustomerMapCardProps) {
  const { t } = useTranslation()
  const { formatDistance } = useFormatters()
  const type = customerTypeStyle[c.type]

  return (
    <article className="card" aria-labelledby="map-card-title">
      <div className="card-body p-3">
        <div className="d-flex align-items-start gap-3">
          <span className={`${styles.icon} ${styles[type.className]}`} aria-hidden="true">
            <i className={`bi ${type.icon}`} />
          </span>
          <div className={`flex-grow-1 ${styles.heading}`}>
            <h2 id="map-card-title" className="h6 fw-semibold text-body-emphasis mb-1">
              {c.name}
            </h2>
            <div className="d-flex flex-wrap align-items-center gap-2 small text-body-secondary">
              {t(`customers.types.${c.type}`)}
              <StatusBadge tone={c.status === 'active' ? 'success' : 'danger'}>
                {t(`customers.status.${c.status}`)}
              </StatusBadge>
            </div>
          </div>
          <button type="button" className="btn-close" aria-label={t('map.close')} onClick={onClose} />
        </div>

        <dl className={`${styles.details} small mt-3 mb-0`}>
          <dt>
            <i className="bi bi-geo-alt" aria-hidden="true" />
            <span className="visually-hidden">{t('customers.columns.address')}</span>
          </dt>
          <dd>
            {c.address}, {c.postalCode} {c.city}
            {distance !== undefined && (
              <span className="fw-semibold text-body-emphasis">
                {' · '}
                {t('customers.distanceAway', { distance: formatDistance(distance) })}
              </span>
            )}
          </dd>
          <dt>
            <i className="bi bi-person" aria-hidden="true" />
            <span className="visually-hidden">{t('customers.columns.contact')}</span>
          </dt>
          <dd>
            {c.contactPerson}
            {' · '}
            <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="text-decoration-none text-nowrap">
              {c.phone}
            </a>
          </dd>
        </dl>

        <div className="d-flex align-items-start gap-2 mt-3">
          <a
            href={googleMaps.directions(`${c.address}, ${c.postalCode} ${c.city}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-primary flex-fill text-nowrap"
          >
            <i className="bi bi-sign-turn-right me-2" aria-hidden="true" />
            {t('customers.directions')}
          </a>
          <CheckInButton key={c.id} customer={c} className="flex-fill" />
        </div>
      </div>
    </article>
  )
}
