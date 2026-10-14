import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productsApi } from './api'
import type { NewProduct, ProductUpdate } from './types'

export const productKeys = {
  all: ['products'] as const,
  detail: (id: string) => [...productKeys.all, id] as const,
}

export const useProducts = () =>
  useQuery({ queryKey: productKeys.all, queryFn: productsApi.list })

export const useProduct = (id: string) =>
  useQuery({ queryKey: productKeys.detail(id), queryFn: () => productsApi.get(id) })

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: NewProduct) => productsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductUpdate }) => productsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  })
}
