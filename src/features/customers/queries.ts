import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customersApi } from './api'
import type { CustomerUpdate, NewCustomer } from './types'

export const customerKeys = {
  all: ['customers'] as const,
  detail: (id: string) => [...customerKeys.all, id] as const,
}

export const useCustomers = () =>
  useQuery({ queryKey: customerKeys.all, queryFn: customersApi.list })

export const useCustomer = (id: string) =>
  useQuery({ queryKey: customerKeys.detail(id), queryFn: () => customersApi.get(id) })

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: NewCustomer) => customersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerUpdate }) => customersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  })
}
