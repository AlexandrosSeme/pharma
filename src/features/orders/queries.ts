import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCustomers } from '@/features/customers'
import { ordersApi } from './api'
import type { NewOrder, OrderRow, OrderUpdate } from './types'

export const orderKeys = {
  all: ['orders'] as const,
  detail: (id: string) => [...orderKeys.all, id] as const,
}

export const useOrders = () =>
  useQuery({ queryKey: orderKeys.all, queryFn: ordersApi.list })

export const useOrder = (id: string) =>
  useQuery({ queryKey: orderKeys.detail(id), queryFn: () => ordersApi.get(id) })

export function useOrderRows() {
  const orders = useOrders()
  const customers = useCustomers()

  const customerName = new Map(customers.data?.map((c) => [c.id, c.name]))
  const rows: OrderRow[] | undefined = orders.data
    ?.toSorted((a, b) => b.orderDate.localeCompare(a.orderDate))
    .map((o) => ({ ...o, customerName: customerName.get(o.customerId) ?? '—' }))

  return {
    rows,
    isLoading: orders.isLoading || customers.isLoading,
    error: orders.error ?? customers.error,
  }
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: NewOrder) => ordersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: orderKeys.all }),
  })
}

export function useUpdateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrderUpdate }) => ordersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: orderKeys.all }),
  })
}

export function useDeleteOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ordersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: orderKeys.all }),
  })
}
