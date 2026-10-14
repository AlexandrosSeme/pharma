import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './ChartCard.module.css'

type ChartCardProps = {
  title: string
  subtitle?: string
  action?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  error?: Error | null
  isEmpty?: boolean
  children: ReactNode
}

export function ChartCard({
  title,
  subtitle,
  action,
  size = 'md',
  isLoading,
  error,
  isEmpty,
  children,
}: ChartCardProps) {
  const { t } = useTranslation()

  let body = children
  if (isLoading) {
    body = (
      <div className={styles.state}>
        <div className="spinner-border spinner-border-sm" role="status" aria-label={t('common.loading')} />
      </div>
    )
  } else if (error) {
    body = <div className={`${styles.state} text-danger small`}>{t('common.error', { message: error.message })}</div>
  } else if (isEmpty) {
    body = <div className={`${styles.state} small`}>{t('common.noData')}</div>
  }

  return (
    <div className="card h-100">
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
          <div>
            <h2 className="h6 fw-semibold mb-0">{title}</h2>
            {subtitle && <div className="small text-body-secondary">{subtitle}</div>}
          </div>
          {action}
        </div>
        <div className={`${styles.canvas} ${styles[size]}`}>{body}</div>
      </div>
    </div>
  )
}
