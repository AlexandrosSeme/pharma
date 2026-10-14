import { Fragment, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './DataTable.module.css'

export type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  align?: 'left' | 'right'
  /**
   * On small screens rows render as cards: 'title' is the card heading (defaults to the first column),
   * 'footer' spans the bottom of the card without a label (for action buttons), 'hidden' is left out.
   */
  mobile?: 'title' | 'footer' | 'hidden'
  /** Extra classes for the column's table cells, e.g. 'd-none d-xxl-table-cell' to drop it on narrower desktops. */
  tableClassName?: string
}

const cardBreakpoints = {
  md: { cards: 'd-md-none', table: 'd-md-block' },
  lg: { cards: 'd-lg-none', table: 'd-lg-block' },
  xl: { cards: 'd-xl-none', table: 'd-xl-block' },
}

const cellClassName = (col: Column<never>) =>
  [col.align === 'right' && 'text-end', col.tableClassName].filter(Boolean).join(' ') || undefined

type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[] | undefined
  isLoading?: boolean
  error?: Error | null
  emptyText?: string
  /** Breakpoint from which the table replaces the cards. Wide tables use 'xl' so tablets get cards (two per row). */
  cardsBelow?: keyof typeof cardBreakpoints
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  isLoading,
  error,
  emptyText,
  cardsBelow = 'md',
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
  const fieldColumns = columns.filter((c) => c !== titleColumn && !c.mobile)
  const footerColumns = columns.filter((c) => c !== titleColumn && c.mobile === 'footer')
  const breakpoint = cardBreakpoints[cardsBelow]

  return (
    <>
      <ul className={`list-unstyled mb-0 ${styles.cards} ${breakpoint.cards}`}>
        {rows.map((row) => (
          <li key={row.id} className="card">
            <div className="card-body d-flex flex-column p-3">
              <div className="fw-semibold text-body-emphasis mb-2">{titleColumn.render(row)}</div>
              <dl className={`${styles.fields} small mb-0`}>
                {fieldColumns.map((col) => (
                  <Fragment key={col.key}>
                    <dt className="fw-normal text-body-secondary">{col.header}</dt>
                    <dd className="mb-0 text-end">{col.render(row)}</dd>
                  </Fragment>
                ))}
              </dl>
              {footerColumns.map((col) => (
                <div key={col.key} className="mt-auto pt-3">
                  {col.render(row)}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <div className={`card overflow-hidden d-none ${breakpoint.table}`}>
        <div className="table-responsive">
          <table className={`table table-hover align-middle text-nowrap mb-0 ${styles.table}`}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} scope="col" className={cellClassName(col)}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((col) => (
                    <td key={col.key} className={cellClassName(col)}>
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
