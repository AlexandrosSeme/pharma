import { useMemo } from 'react'
import { useCustomers } from '@/features/customers/queries'
import { canSeeCustomer } from './scope'
import { useScope } from './useScope'

export function useVisibleCustomers() {
  const query = useCustomers()
  const { scopeUserId, scopeRole } = useScope()
  const data = useMemo(
    () => query.data?.filter((customer) => scopeUserId && canSeeCustomer(customer, scopeUserId, scopeRole)),
    [query.data, scopeUserId, scopeRole],
  )
  return { ...query, data }
}
