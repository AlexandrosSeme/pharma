import { useTranslation } from 'react-i18next'
import { localized } from '../lib/text'
import type { Medication } from '../types'
import styles from '../components/Section.module.css'

export function MedicationPagePrecautions({ item }: { item: Medication }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage

  return (
    <div className={styles.alerts}>
      <section className={`${styles.alert} ${styles.contra}`}>
        <h3>
          <i className="bi bi-slash-circle" aria-hidden="true" />
          {t('medication.precautions.contraindications')}
        </h3>
        <ul>
          {item.precautions.contraindications.map((row) => (
            <li key={row.en}>{localized(row, lang)}</li>
          ))}
        </ul>
      </section>
      <section className={`${styles.alert} ${styles.warn}`}>
        <h3>
          <i className="bi bi-exclamation-triangle" aria-hidden="true" />
          {t('medication.precautions.warnings')}
        </h3>
        <ul>
          {item.precautions.warnings.map((row) => (
            <li key={row.en}>{localized(row, lang)}</li>
          ))}
        </ul>
      </section>
      <section className={`${styles.alert} ${styles.life}`}>
        <h3>
          <i className="bi bi-heart" aria-hidden="true" />
          {t('medication.precautions.pregnancy')}
        </h3>
        <p>{localized(item.precautions.pregnancy, lang)}</p>
      </section>
      <section className={`${styles.alert} ${styles.life}`}>
        <h3>
          <i className="bi bi-person-heart" aria-hidden="true" />
          {t('medication.precautions.lactation')}
        </h3>
        <p>{localized(item.precautions.lactation, lang)}</p>
      </section>
    </div>
  )
}
