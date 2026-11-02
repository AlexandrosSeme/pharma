import type { ReactNode } from 'react'
import styles from './IconDetails.module.css'

export type IconDetail = {
  icon: string
  /** Read by screen readers in place of the icon. */
  label: string
  content: ReactNode
}

type IconDetailsProps = {
  items: IconDetail[]
  className?: string
}

export function IconDetails({ items, className = '' }: IconDetailsProps) {
  return (
    <dl className={`${styles.details} ${className}`}>
      {items.map((item) => (
        <div key={item.label} className={styles.row}>
          <dt>
            <i className={`bi ${item.icon}`} aria-hidden="true" />
            <span className="visually-hidden">{item.label}</span>
          </dt>
          <dd>{item.content}</dd>
        </div>
      ))}
    </dl>
  )
}
