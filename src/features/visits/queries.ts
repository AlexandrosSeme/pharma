import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
// Not the customers index: customers renders CheckInButton, which would make the imports circular.
import { useCustomers } from '@/features/customers/queries'
import type { Customer } from '@/features/customers/types'
import { getCurrentPosition } from '@/shared/hooks/useGeolocation'
import { distanceInMeters, hasCoordinates } from '@/shared/lib/geo'
import { visitsApi } from './api'
import type { VisitRow } from './types'

export const visitKeys = {
  all: ['visits'] as const,
}

export const useVisits = () => useQuery({ queryKey: visitKeys.all, queryFn: visitsApi.list })

/** Visits newest first, joined with customer names. */
export function useVisitRows() {
  const visits = useVisits()
  const customers = useCustomers()

  const customerName = new Map(customers.data?.map((c) => [c.id, c.name]))
  const rows: VisitRow[] | undefined = visits.data
    ?.toSorted((a, b) => b.checkedInAt.localeCompare(a.checkedInAt))
    .map((v) => ({ ...v, customerName: customerName.get(v.customerId) ?? '—' }))

  return {
    rows,
    isLoading: visits.isLoading || customers.isLoading,
    error: visits.error ?? customers.error,
  }
}

/** Reads the device position, then records a visit for the signed-in rep. */
export function useCheckIn() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (customer: Customer) => {
      if (!user) throw new Error('Not signed in')
      const position = await getCurrentPosition()
      return visitsApi.create({
        customerId: customer.id,
        repId: user.id,
        repName: user.name,
        checkedInAt: new Date().toISOString(),
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: Math.round(position.accuracy),
        distanceToCustomer: hasCoordinates(customer)
          ? Math.round(distanceInMeters(position, customer))
          : undefined,
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: visitKeys.all }),
  })
}
