import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { PageHeader, SearchInput, Select } from '@/shared/ui'
import { LeadsTable } from '../components/LeadsTable'
import { useLeads } from '../queries'
import { leadStatuses } from '../types'

export function LeadsPage() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useLeads()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const term = useDebounce(search).trim().toLowerCase()

  const rows = data
    ?.filter(
      (l) =>
        (!status || l.status === status) &&
        [l.companyName, l.contactPerson, l.city].some((field) => field.toLowerCase().includes(term)),
    )
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <section>
      <PageHeader
        title={t('leads.title')}
        subtitle={t('leads.subtitle')}
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
      <LeadsTable leads={rows} isLoading={isLoading} error={error} />
    </section>
  )
}
