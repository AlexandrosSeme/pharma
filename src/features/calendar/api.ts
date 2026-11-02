import { http } from '@/shared/api/httpClient'
import type { Activity, ActivityUpdate, NewActivity } from './types'

export const activitiesApi = {
  list: () => http.get<Activity[]>('/activities'),
  create: (data: NewActivity) => http.post<Activity>('/activities', data),
  update: (id: string, data: ActivityUpdate) => http.patch<Activity>(`/activities/${id}`, data),
  remove: (id: string) => http.delete(`/activities/${id}`),
}
