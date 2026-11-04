import type { CustomerType } from '@/features/customers'

type TypeStyle = {
  icon: string
  /** Same token as the pin classes in the map CSS modules. */
  color: string
  className: 'pharmacy' | 'clinic' | 'hospital' | 'eopyy'
}

export const customerTypeStyle: Record<CustomerType, TypeStyle> = {
  Pharmacy: { icon: 'bi-plus-lg', color: 'var(--app-pin-pharmacy)', className: 'pharmacy' },
  Clinic: { icon: 'bi-heart-pulse', color: 'var(--app-pin-clinic)', className: 'clinic' },
  Hospital: { icon: 'bi-h-square', color: 'var(--app-pin-hospital)', className: 'hospital' },
  Eopyy: { icon: 'bi-building', color: 'var(--app-pin-eopyy)', className: 'eopyy' },
}
