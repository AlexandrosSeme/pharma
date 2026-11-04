import { http } from '@/shared/api/httpClient'
import type { ClmDeck, ClmSession, NewClmSession } from './types'

export const clmApi = {
  decks: () => http.get<ClmDeck[]>('/clmDecks'),
  deck: (id: string) => http.get<ClmDeck>(`/clmDecks/${id}`),
  sessions: () => http.get<ClmSession[]>('/clmSessions'),
  createSession: (data: NewClmSession) => http.post<ClmSession>('/clmSessions', data),
}
