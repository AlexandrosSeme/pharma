import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { StatusBadge } from '@/shared/ui'
import { atcTone } from '../lib/atcStyle'
import type { Medication } from '../types'
import styles from './MedicationList.module.css'

type MedicationListProps = {
  items: Medication[]
  selectedId: string | undefined
  onSelect: (id: string) => void
}

export function MedicationList({ items, selectedId, onSelect }: MedicationListProps) {
  const { t, i18n } = useTranslation()
  const el = i18n.resolvedLanguage?.startsWith('el')

  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            className={styles.item}
            style={{ '--atc-tone': atcTone(item.atcCode) } as CSSProperties}
            aria-current={String(item.id) === selectedId || undefined}
            onClick={() => onSelect(String(item.id))}
          >
            <span className={styles.stripe} aria-hidden="true" />
            <span className={styles.body}>
              <span className={styles.name}>{item.tradeName}</span>
              <span className={styles.inn}>{el ? item.innEl : item.inn}</span>
              <span className={styles.meta}>
                <span className={styles.atc}>{item.atcCode}</span>
                <StatusBadge tone={item.availability.prescription ? 'info' : 'neutral'}>
                  {t(item.availability.prescription ? 'medication.legal.rx' : 'medication.legal.otc')}
                </StatusBadge>
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
