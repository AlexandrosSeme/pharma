export { territoriesApi } from './api'
export { accountIdsOf, accountsInTerritory, territoryForAccount, territoryForCity, territoryHasAccount } from './membership'
export { territoryKeys, useRemoveTerritory, useSaveTerritory, useTerritories } from './queries'
export type { Territory, TerritoryName } from './types'

export function territoryName(name: { en: string; el: string }, lang?: string) {
  return lang?.startsWith('el') ? name.el : name.en
}
