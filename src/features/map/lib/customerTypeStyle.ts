import type { CustomerType } from '@/features/customers'

type TypeStyle = {
  icon: string
  /** Same token as the pin classes `.pharmacy`, `.clinic`, `.hospital` in the map CSS modules. */
  color: string
  className: 'pharmacy' | 'clinic' | 'hospital'
}

export const customerTypeStyle: Record<CustomerType, TypeStyle> = {
  Pharmacy: { icon: 'bi-capsule', color: 'var(--app-chart-1)', className: 'pharmacy' },
  Clinic: { icon: 'bi-heart-pulse', color: 'var(--app-chart-2)', className: 'clinic' },
  Hospital: { icon: 'bi-hospital', color: 'var(--app-chart-4)', className: 'hospital' },
}
