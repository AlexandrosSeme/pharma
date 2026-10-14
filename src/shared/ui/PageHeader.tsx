import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

type PageHeaderProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className={`${styles.header} mb-4`}>
      <div>
        <h1 className="h2 mb-1">{title}</h1>
        {subtitle && <p className="text-body-secondary mb-0">{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
