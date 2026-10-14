import type { ReactNode } from 'react'
import { toneVariant, type BadgeTone } from './tones'
import styles from './KpiCard.module.css'

type KpiCardProps = {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: string
  tone?: BadgeTone
}

export function KpiCard({ label, value, hint, icon, tone = 'neutral' }: KpiCardProps) {
  const variant = toneVariant[tone]

  return (
    <div className="col">
      <div className="card h-100">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
            <span className="small fw-medium text-body-secondary">{label}</span>
            {icon && <i className={`bi ${icon} ${styles.icon} text-${variant}`} aria-hidden="true" />}
          </div>
          <div className={`${styles.value} fs-4 fw-semibold text-body-emphasis`}>{value}</div>
          {hint && <div className="small text-body-secondary mt-1">{hint}</div>}
        </div>
      </div>
    </div>
  )
}

type KpiGridProps = {
  columns?: 4 | 5
  children: ReactNode
}

export function KpiGrid({ columns = 5, children }: KpiGridProps) {
  return (
    <div className={`row row-cols-1 row-cols-sm-2 row-cols-lg-${columns === 4 ? 4 : 3} row-cols-xxl-${columns} g-3 mb-4`}>
      {children}
    </div>
  )
}
