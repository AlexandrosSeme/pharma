import { http } from '@/shared/api/httpClient'
import type { Lead, LeadUpdate, NewLead } from './types'

export const leadsApi = {
  list: () => http.get<Lead[]>('/leads'),
  get: (id: string) => http.get<Lead>(`/leads/${id}`),
  create: (data: NewLead) => http.post<Lead>('/leads', data),
  update: (id: string, data: LeadUpdate) => http.patch<Lead>(`/leads/${id}`, data),
  remove: (id: string) => http.delete(`/leads/${id}`),
}
