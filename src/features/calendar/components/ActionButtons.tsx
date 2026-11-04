import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { activityStyle } from '../lib/activityStyle'
import { activityTypes, type ActivityType } from '../types'
import styles from './ActionButtons.module.css'

type ActionButtonsProps = {
  value: ActivityType | null
  onChange: (type: ActivityType | null) => void
  label: string
  /** Page filter is a full-width bar. A picker is the four choices inside a dialog. */
  variant?: 'filter' | 'picker'
  /** Clicking the selected action clears it. The form keeps a type, so it turns this off. */
  allowEmpty?: boolean
  /** Show only the current action, without offering a change. */
  readOnly?: boolean
  counts?: Partial<Record<ActivityType, number>>
}

export function ActionButtons({
  value,
  onChange,
  label,
  variant = 'picker',
  allowEmpty = true,
  readOnly = false,
  counts,
}: ActionButtonsProps) {
  const { t } = useTranslation()
  const types = readOnly && value ? [value] : activityTypes

  return (
    <div className={variant === 'filter' ? styles.filter : styles.picker} role="radiogroup" aria-label={label}>
      {types.map((type) => {
        const selected = value === type
        const style = activityStyle[type]
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={readOnly}
            className={[styles.choice, selected ? styles.selected : ''].filter(Boolean).join(' ')}
            style={{ '--action-color': style.color, '--action-ink': style.contrastColor } as CSSProperties}
            onClick={() => onChange(selected && allowEmpty ? null : type)}
          >
            <span className={styles.mark}>
              <i className={`bi ${style.icon}`} aria-hidden="true" />
            </span>
            <span className={styles.name}>{t(`calendar.types.${type}`)}</span>
            {counts?.[type] !== undefined && <span className={styles.count}>{counts[type]}</span>}
          </button>
        )
      })}
    </div>
  )
}
