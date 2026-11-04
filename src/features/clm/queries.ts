import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clmApi } from './api'
import type { NewClmSession } from './types'

export const clmKeys = {
  decks: ['clm', 'decks'] as const,
  deck: (id: string) => ['clm', 'decks', id] as const,
  sessions: ['clm', 'sessions'] as const,
}

export const useClmDecks = () => useQuery({ queryKey: clmKeys.decks, queryFn: clmApi.decks })

export const useClmDeck = (id: string) =>
  useQuery({ queryKey: clmKeys.deck(id), queryFn: () => clmApi.deck(id), enabled: Boolean(id) })

export const useClmSessions = () => useQuery({ queryKey: clmKeys.sessions, queryFn: clmApi.sessions })

export function useCreateClmSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: NewClmSession) => clmApi.createSession(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: clmKeys.sessions }),
  })
}
