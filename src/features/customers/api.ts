import { http } from '@/shared/api/httpClient'
import type { Customer, CustomerUpdate, NewCustomer } from './types'

export const customersApi = {
  list: () => http.get<Customer[]>('/customers'),
  get: (id: string) => http.get<Customer>(`/customers/${id}`),
  create: (data: NewCustomer) => http.post<Customer>('/customers', data),
  update: (id: string, data: CustomerUpdate) => http.patch<Customer>(`/customers/${id}`, data),
  remove: (id: string) => http.delete(`/customers/${id}`),
}
