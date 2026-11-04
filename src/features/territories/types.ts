export type TerritoryName = { en: string; el: string }

/** A named batch of accounts held by one rep. */
export type Territory = {
  id: string
  name: TerritoryName
  /** The manager of the rep who holds this batch. */
  managerId: string
  repId: string
  /** Cities of the accounts, kept so a lead can still find its area. */
  cities: string[]
  /** The accounts in this batch. Source of truth for who belongs where. */
  accountIds: string[]
}

export type TerritoryInput = Omit<Territory, 'id'>

export type TerritoryUpdate = Partial<TerritoryInput>
