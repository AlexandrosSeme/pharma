import { useTranslation } from 'react-i18next'
import { localized } from '../lib/text'
import type { Medication } from '../types'
import styles from '../components/Section.module.css'

export function MedicationPageAdministration({ item }: { item: Medication }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage
  const steps = [
    { id: 'route', text: localized(item.administration.route, lang) },
    { id: 'posology', text: localized(item.administration.posology, lang) },
    { id: 'duration', text: localized(item.administration.duration, lang) },
  ]

  return (
    <ol className={styles.steps}>
      {steps.map((step, index) => (
        <li key={step.id} className={styles.step}>
          <div className={styles.rail} aria-hidden="true">
            <span className={styles.dot} />
            {index < steps.length - 1 && <span className={styles.line} />}
          </div>
          <div className={styles.stepBody}>
            <p className={styles.stepLabel}>{t(`medication.administration.${step.id}`)}</p>
            <p className={styles.stepText}>{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
