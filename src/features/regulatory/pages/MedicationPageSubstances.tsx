import { useTranslation } from 'react-i18next'
import type { Medication } from '../types'
import styles from '../components/Section.module.css'

export function MedicationPageSubstances({ item }: { item: Medication }) {
  const { t, i18n } = useTranslation()
  const el = i18n.resolvedLanguage?.startsWith('el')

  return (
    <div className={styles.formula}>
      {item.substances.map((row) => (
        <div key={`${row.role}-${row.name}`} className={styles.row}>
          <span
            className={`${styles.mark} ${row.role === 'active' ? styles.activeMark : styles.excipientMark}`}
            aria-hidden="true"
          >
            <i className={`bi ${row.role === 'active' ? 'bi-droplet-fill' : 'bi-circle'}`} />
          </span>
          <div>
            <div className={styles.rowName}>{el ? row.nameEl : row.name}</div>
            <div className={styles.rowMeta}>{t(`medication.substances.${row.role}`)}</div>
          </div>
          <strong>{row.amount}</strong>
        </div>
      ))}
    </div>
  )
}
