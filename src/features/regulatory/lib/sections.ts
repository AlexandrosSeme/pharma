import type { MedicationTab } from '../types'

export const medicationSections: Array<{
  id: MedicationTab
  icon: string
}> = [
  { id: 'info', icon: 'bi-journal-richtext' },
  { id: 'substances', icon: 'bi-droplet-half' },
  { id: 'administration', icon: 'bi-heart-pulse' },
  { id: 'availability', icon: 'bi-box-seam' },
  { id: 'precautions', icon: 'bi-shield-exclamation' },
  { id: 'prices', icon: 'bi-graph-up' },
]
