import { Fragment, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './DataTable.module.css'

export type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  align?: 'left' | 'right'
  /** On small screens rows render as cards: 'title' is the card heading (defaults to the first column), 'hidden' is left out. */
  mobile?: 'title' | 'hidden'
}

type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[] | undefined
  isLoading?: boolean
  error?: Error | null
  emptyText?: string
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  isLoading,
  error,
  emptyText,
}: DataTableProps<T>) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="d-flex align-items-center gap-2 py-4 text-body-secondary">
        <div className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
        {t('common.loading')}
      </div>
    )
  }
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {t('common.error', { message: error.message })}
      </div>
    )
  }
  if (!rows?.length) return <p className="py-4 text-body-secondary">{emptyText ?? t('common.empty')}</p>

  const titleColumn = columns.find((c) => c.mobile === 'title') ?? columns[0]
  const fieldColumns = columns.filter((c) => c !== titleColumn && c.mobile !== 'hidden')

  return (
    <>
      <ul className="list-unstyled vstack gap-2 mb-0 d-md-none">
        {rows.map((row) => (
          <li key={row.id} className="card">
            <div className="card-body p-3">
              <div className="fw-semibold text-body-emphasis mb-2">{titleColumn.render(row)}</div>
              <dl className={`${styles.fields} small mb-0`}>
                {fieldColumns.map((col) => (
                  <Fragment key={col.key}>
                    <dt className="fw-normal text-body-secondary">{col.header}</dt>
                    <dd className="mb-0 text-end">{col.render(row)}</dd>
                  </Fragment>
                ))}
              </dl>
            </div>
          </li>
        ))}
      </ul>

      <div className="card overflow-hidden d-none d-md-block">
        <div className="table-responsive">
          <table className={`table table-hover align-middle text-nowrap mb-0 ${styles.table}`}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} scope="col" className={col.align === 'right' ? 'text-end' : undefined}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((col) => (
                    <td key={col.key} className={col.align === 'right' ? 'text-end' : undefined}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
