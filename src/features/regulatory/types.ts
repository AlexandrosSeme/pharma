export type Localized = { en: string; el: string }

export type Substance = {
  name: string
  nameEl: string
  amount: string
  role: 'active' | 'excipient'
}

export type PricePoint = {
  month: string
  wholesale: number
  pharmacy: number
  reimbursement: number | null
}

export type Medication = {
  id: string
  inn: string
  innEl: string
  tradeName: string
  atcCode: string
  atcPath: Localized
  eofChapter: string
  maHolder: string
  maNumber: string
  summary: Localized
  substances: Substance[]
  administration: {
    route: Localized
    posology: Localized
    duration: Localized
  }
  availability: {
    prescription: boolean
    eopyy: boolean
    hospital: boolean
    retail: boolean
    note: Localized
  }
  precautions: {
    contraindications: Localized[]
    warnings: Localized[]
    pregnancy: Localized
    lactation: Localized
  }
  prices: PricePoint[]
}

export const medicationTabs = [
  'info',
  'substances',
  'administration',
  'availability',
  'precautions',
  'prices',
] as const

export type MedicationTab = (typeof medicationTabs)[number]
