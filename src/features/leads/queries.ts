import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { leadsApi } from './api'
import type { LeadUpdate, NewLead } from './types'

export const leadKeys = {
  all: ['leads'] as const,
  detail: (id: string) => [...leadKeys.all, id] as const,
}

export const useLeads = () =>
  useQuery({ queryKey: leadKeys.all, queryFn: leadsApi.list })

export const useLead = (id: string) =>
  useQuery({ queryKey: leadKeys.detail(id), queryFn: () => leadsApi.get(id) })

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: NewLead) => leadsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: leadKeys.all }),
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LeadUpdate }) => leadsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: leadKeys.all }),
  })
}

export function useDeleteLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => leadsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: leadKeys.all }),
  })
}
