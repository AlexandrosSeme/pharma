import { http } from '@/shared/api/httpClient'
import type { Medication } from './types'

export const medicationsApi = {
  list: () => http.get<Medication[]>('/medications'),
}
