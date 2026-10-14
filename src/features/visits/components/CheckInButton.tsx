import { useTranslation } from 'react-i18next'
import type { Customer } from '@/features/customers/types'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { GeoError } from '@/shared/hooks/useGeolocation'
import { useCheckIn } from '../queries'

type CheckInButtonProps = {
  customer: Customer
  className?: string
}

export function CheckInButton({ customer, className }: CheckInButtonProps) {
  const { t } = useTranslation()
  const { formatTime } = useFormatters()
  const checkIn = useCheckIn()
  const visit = checkIn.data

  const label = checkIn.isPending
    ? t('visits.checkingIn')
    : visit
      ? t('visits.checkedInAt', { time: formatTime(visit.checkedInAt) })
      : t('visits.checkIn')

  return (
    <div className={className}>
      <button
        type="button"
        className={`btn w-100 text-nowrap ${visit ? 'btn-outline-success' : 'btn-primary'}`}
        disabled={checkIn.isPending || !!visit}
        onClick={() => checkIn.mutate(customer)}
      >
        {checkIn.isPending ? (
          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
        ) : (
          <i className={`bi ${visit ? 'bi-check-circle-fill' : 'bi-person-check'} me-2`} aria-hidden="true" />
        )}
        {label}
      </button>
      <div aria-live="polite">
        {checkIn.error && (
          <p className="small text-danger text-wrap mt-1 mb-0">
            {checkIn.error instanceof GeoError
              ? t(`location.errors.${checkIn.error.code}`)
              : t('visits.checkInFailed')}
          </p>
        )}
      </div>
    </div>
  )
}
