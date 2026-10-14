import type { CustomerType } from '@/features/customers'

/** Pin icon and color per customer type; colors live in CustomerMap.module.css as `.pharmacy`, `.clinic`, `.hospital`. */
export const customerTypeStyle: Record<CustomerType, { icon: string; className: 'pharmacy' | 'clinic' | 'hospital' }> = {
  Pharmacy: { icon: 'bi-capsule', className: 'pharmacy' },
  Clinic: { icon: 'bi-heart-pulse', className: 'clinic' },
  Hospital: { icon: 'bi-hospital', className: 'hospital' },
}
