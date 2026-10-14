import { http } from '@/shared/api/httpClient'
import type { NewVisit, Visit } from './types'

export const visitsApi = {
  list: () => http.get<Visit[]>('/visits'),
  create: (data: NewVisit) => http.post<Visit>('/visits', data),
}
