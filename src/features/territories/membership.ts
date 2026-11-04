import type { Territory } from './types'

type Account = { id: string; city: string; repId?: string }

export function accountIdsOf(territory: Territory) {
  return (territory.accountIds ?? []).map(String)
}

/** True when this account sits in the batch. Older rows that have no ids still match by city and rep. */
export function territoryHasAccount(territory: Territory, account: Account) {
  const ids = accountIdsOf(territory)
  if (ids.length > 0) return ids.includes(String(account.id))
  return territory.cities.includes(account.city) && territory.repId === account.repId
}

export function accountsInTerritory<T extends Account>(territory: Territory, accounts: T[]) {
  return accounts.filter((account) => territoryHasAccount(territory, account))
}

/** The batch that covers a city. Prefers the one that actually holds accounts there. */
export function territoryForCity(territories: Territory[], city: string, accounts: Account[]) {
  const ranked = territories
    .map((territory) => ({
      territory,
      count: accountsInTerritory(territory, accounts).filter((account) => account.city === city).length,
    }))
    .filter((entry) => entry.count > 0)
    .toSorted((a, b) => b.count - a.count)
  return ranked[0]?.territory ?? territories.find((territory) => territory.cities.includes(city))
}

export function territoryForAccount<T extends Account>(territories: Territory[], account: T) {
  return (
    territories.find((territory) => accountIdsOf(territory).includes(String(account.id))) ??
    territories.find(
      (territory) =>
        accountIdsOf(territory).length === 0 &&
        territory.cities.includes(account.city) &&
        territory.repId === account.repId,
    )
  )
}
