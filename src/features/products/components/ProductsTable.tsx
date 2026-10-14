import { useTranslation } from 'react-i18next'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { DataTable, StatusBadge, type Column } from '@/shared/ui'
import type { Product } from '../types'

type ProductsTableProps = {
  products: Product[] | undefined
  isLoading?: boolean
  error?: Error | null
}

export function ProductsTable({ products, isLoading, error }: ProductsTableProps) {
  const { t } = useTranslation()
  const { formatMoney, formatNumber } = useFormatters()

  const columns: Column<Product>[] = [
    { key: 'sku', header: t('products.columns.sku'), render: (p) => p.sku },
    { key: 'name', header: t('products.columns.name'), render: (p) => p.name, mobile: 'title' },
    { key: 'category', header: t('products.columns.category'), render: (p) => p.category },
    { key: 'form', header: t('products.columns.form'), render: (p) => `${p.form} × ${p.packSize}` },
    {
      key: 'rx',
      header: t('products.columns.rx'),
      render: (p) => (p.prescriptionRequired ? t('common.yes') : t('common.no')),
    },
    { key: 'price', header: t('products.columns.price'), render: (p) => formatMoney(p.price), align: 'right' },
    { key: 'stock', header: t('products.columns.stock'), render: (p) => formatNumber(p.stock), align: 'right' },
    {
      key: 'status',
      header: t('products.columns.status'),
      render: (p) => (
        <StatusBadge tone={p.active ? 'success' : 'danger'}>
          {t(p.active ? 'products.status.active' : 'products.status.inactive')}
        </StatusBadge>
      ),
    },
  ]

  return <DataTable columns={columns} rows={products} isLoading={isLoading} error={error} />
}
