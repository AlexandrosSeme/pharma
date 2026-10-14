import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { PageHeader, SearchInput, Select } from '@/shared/ui'
import { ProductsTable } from '../components/ProductsTable'
import { useProducts } from '../queries'

export function ProductsPage() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useProducts()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const term = useDebounce(search).trim().toLowerCase()

  const categories = [...new Set(data?.map((p) => p.category))].sort()
  const rows = data?.filter(
    (p) =>
      (!category || p.category === category) &&
      (p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)),
  )

  return (
    <section>
      <PageHeader
        title={t('products.title')}
        subtitle={t('products.subtitle')}
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder={t('products.searchPlaceholder')} />
            <Select
              aria-label={t('products.columns.category')}
              value={category}
              onChange={setCategory}
              options={[
                { value: '', label: t('products.allCategories') },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
            />
          </>
        }
      />
      <ProductsTable products={rows} isLoading={isLoading} error={error} />
    </section>
  )
}
