import { http } from '@/shared/api/httpClient'
import type { NewProduct, Product, ProductUpdate } from './types'

export const productsApi = {
  list: () => http.get<Product[]>('/products'),
  get: (id: string) => http.get<Product>(`/products/${id}`),
  create: (data: NewProduct) => http.post<Product>('/products', data),
  update: (id: string, data: ProductUpdate) => http.patch<Product>(`/products/${id}`, data),
  remove: (id: string) => http.delete(`/products/${id}`),
}
