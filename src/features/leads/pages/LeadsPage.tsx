import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useScope, useVisibleCustomers } from '@/features/team'
import { useWatchSubtitle } from '@/features/team/useWatchSubtitle'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { PageHeader, SearchInput, Select } from '@/shared/ui'
import { LeadsTable } from '../components/LeadsTable'
import { useLeads } from '../queries'
import { leadStatuses } from '../types'

export function LeadsPage() {
  const { t } = useTranslation()
  const { scopeRole } = useScope()
  const customers = useVisibleCustomers()
  const { data, isLoading, error } = useLeads()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const term = useDebounce(search).trim().toLowerCase()
  const cities = new Set((customers.data ?? []).map((customer) => customer.city))
  const waiting = isLoading || customers.isLoading

  const rows = waiting
    ? undefined
    : data
        ?.filter(
          (l) =>
            (scopeRole === 'director' || cities.has(l.city)) &&
            (!status || l.status === status) &&
            [l.companyName, l.contactPerson, l.city].some((field) => field.toLowerCase().includes(term)),
        )
        .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <section>
      <PageHeader
        title={t('leads.title')}
        subtitle={useWatchSubtitle('leads')}
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder={t('leads.searchPlaceholder')} />
            <Select
              aria-label={t('leads.columns.status')}
              value={status}
              onChange={setStatus}
              options={[
                { value: '', label: t('leads.allStatuses') },
                ...leadStatuses.map((value) => ({ value, label: t(`leads.status.${value}`) })),
              ]}
            />
          </>
        }
      />
      <LeadsTable leads={rows} isLoading={waiting} error={error ?? customers.error} />
    </section>
  )
}
