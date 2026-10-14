import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { PageHeader, SearchInput, Select } from '@/shared/ui'
import { CustomersTable } from '../components/CustomersTable'
import { useCustomers } from '../queries'
import { customerTypes } from '../types'

export function CustomersPage() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useCustomers()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const term = useDebounce(search).trim().toLowerCase()

  const rows = data?.filter(
    (c) =>
      (!type || c.type === type) &&
      [c.name, c.contactPerson, c.city].some((field) => field.toLowerCase().includes(term)),
  )

  return (
    <section>
      <PageHeader
        title={t('customers.title')}
        subtitle={t('customers.subtitle')}
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder={t('customers.searchPlaceholder')} />
            <Select
              aria-label={t('customers.columns.type')}
              value={type}
              onChange={setType}
              options={[
                { value: '', label: t('customers.allTypes') },
                ...customerTypes.map((value) => ({ value, label: t(`customers.types.${value}`) })),
              ]}
            />
          </>
        }
      />
      <CustomersTable customers={rows} isLoading={isLoading} error={error} />
    </section>
  )
}
