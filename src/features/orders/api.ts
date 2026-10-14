import { http } from '@/shared/api/httpClient'
import type { NewOrder, Order, OrderUpdate } from './types'

export const ordersApi = {
  list: () => http.get<Order[]>('/orders'),
  get: (id: string) => http.get<Order>(`/orders/${id}`),
  create: (data: NewOrder) => http.post<Order>('/orders', data),
  update: (id: string, data: OrderUpdate) => http.patch<Order>(`/orders/${id}`, data),
  remove: (id: string) => http.delete(`/orders/${id}`),
}
