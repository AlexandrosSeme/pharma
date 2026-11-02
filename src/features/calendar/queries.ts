import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { activitiesApi } from './api'
import type { Activity, ActivityUpdate, NewActivity } from './types'

export const activityKeys = {
  all: ['activities'] as const,
}

export const useActivities = () => useQuery({ queryKey: activityKeys.all, queryFn: activitiesApi.list })

export function useCreateActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: NewActivity) => activitiesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: activityKeys.all }),
  })
}

/** Optimistic, so an event dragged in the calendar doesn't jump back while the change is saved. */
export function useUpdateActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ActivityUpdate }) => activitiesApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: activityKeys.all })
      const previous = qc.getQueryData<Activity[]>(activityKeys.all)
      qc.setQueryData<Activity[]>(activityKeys.all, (list) => list?.map((a) => (a.id === id ? { ...a, ...data } : a)))
      return { previous }
    },
    onError: (_error, _vars, context) => qc.setQueryData(activityKeys.all, context?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: activityKeys.all }),
  })
}

export function useDeleteActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => activitiesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: activityKeys.all }),
  })
}
