import type { CSSProperties } from 'react'
import styles from './FilterChips.module.css'

export type FilterChip<T> = {
  value: T
  label: string
  count?: number
  /** A color token, e.g. 'var(--app-chart-1)', shown as a legend dot. */
  color?: string
}

type FilterChipsProps<T> = {
  chips: FilterChip<T>[]
  value: T
  onChange: (value: T) => void
  'aria-label': string
}

/** Single-select filter pills that double as a color legend; scrolls sideways on phones. */
export function FilterChips<T extends string | null>({ chips, value, onChange, ...rest }: FilterChipsProps<T>) {
  return (
    <div className={styles.chips} role="group" {...rest}>
      {chips.map((chip) => (
        <button
          key={chip.value ?? 'all'}
          type="button"
          className={`btn ${styles.chip}${value === chip.value ? ' active' : ''}`}
          aria-pressed={value === chip.value}
          onClick={() => onChange(chip.value)}
        >
          {chip.color && (
            <span className={styles.dot} style={{ '--dot-color': chip.color } as CSSProperties} aria-hidden="true" />
          )}
          {chip.label}
          {chip.count !== undefined && <span className={styles.count}>{chip.count}</span>}
        </button>
      ))}
    </div>
  )
}
