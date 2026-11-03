import { useQuery } from '@tanstack/react-query'
import { medicationsApi } from './api'

export const medicationKeys = {
  all: ['medications'] as const,
}

export const useMedications = () =>
  useQuery({ queryKey: medicationKeys.all, queryFn: medicationsApi.list })
