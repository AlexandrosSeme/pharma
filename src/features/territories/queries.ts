import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '@/features/customers/api'
import { customerKeys } from '@/features/customers/queries'
import type { Customer } from '@/features/customers/types'
import type { TeamMember } from '@/features/team'
import { territoriesApi } from './api'
import { accountIdsOf } from './membership'
import type { Territory, TerritoryName } from './types'

export const territoryKeys = {
  all: ['territories'] as const,
}

export const useTerritories = () =>
  useQuery({ queryKey: territoryKeys.all, queryFn: territoriesApi.list })

type SaveTerritoryInput = {
  id?: string
  rep: TeamMember
  name: TerritoryName
  accountIds: string[]
  territories: Territory[]
  customers: Customer[]
}

/** Create or rewrite a batch, and move every chosen account onto that rep. */
export function useSaveTerritory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, rep, name, accountIds, territories, customers }: SaveTerritoryInput) => {
      const chosen = new Set(accountIds.map(String))
      const picked = customers.filter((account) => chosen.has(String(account.id)))
      const previous = territories.find((territory) => territory.id === id)
      const held = previous ? accountIdsOf(previous).filter((accountId) => chosen.has(accountId)) : []
      const kept = [...new Set([...held, ...picked.map((account) => String(account.id))])]
      const cities = [
        ...new Set([
          ...picked.map((account) => account.city),
          ...(kept.length > picked.length ? (previous?.cities ?? []) : []),
        ]),
      ]
      const managerId = rep.managerId ?? previous?.managerId ?? ''
      const body = {
        name,
        repId: rep.id,
        managerId,
        cities,
        accountIds: kept,
      }
      const saved = id
        ? await territoriesApi.update(id, body)
        : await territoriesApi.create({ id: `t-${crypto.randomUUID()}`, ...body })

      await Promise.all(
        picked
          .filter((account) => account.repId !== rep.id)
          .map((account) => customersApi.update(account.id, { repId: rep.id })),
      )

      const others = territories.filter(
        (territory) => territory.id !== saved.id && accountIdsOf(territory).some((accountId) => chosen.has(accountId)),
      )
      await Promise.all(
        others.map((territory) => {
          const nextIds = accountIdsOf(territory).filter((accountId) => !chosen.has(accountId))
          const nextCities = [
            ...new Set(customers.filter((account) => nextIds.includes(String(account.id))).map((account) => account.city)),
          ]
          return territoriesApi.update(territory.id, { accountIds: nextIds, cities: nextCities })
        }),
      )
      return saved
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: territoryKeys.all })
      qc.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

/** Drop the batch. The accounts stay with the rep who holds them. */
export function useRemoveTerritory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => territoriesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: territoryKeys.all }),
  })
}
