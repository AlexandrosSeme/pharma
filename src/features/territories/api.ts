import { http } from '@/shared/api/httpClient'
import type { Territory, TerritoryInput, TerritoryUpdate } from './types'

export const territoriesApi = {
  list: () => http.get<Territory[]>('/territories'),
  create: (data: TerritoryInput & { id: string }) => http.post<Territory>('/territories', data),
  update: (id: string, data: TerritoryUpdate) => http.patch<Territory>(`/territories/${id}`, data),
  remove: (id: string) => http.delete(`/territories/${id}`),
}
