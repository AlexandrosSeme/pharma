import { useTranslation } from 'react-i18next'
import { localized } from '../lib/text'
import type { Medication } from '../types'
import styles from '../components/Section.module.css'

export function MedicationPageInfo({ item }: { item: Medication }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage

  return (
    <div>
      <p className={styles.quote}>{localized(item.summary, lang)}</p>
      <dl className={styles.mosaic}>
        <div className={styles.tile}>
          <dt>{t('medication.fields.inn')}</dt>
          <dd>
            {item.inn}
            <br />
            {item.innEl}
          </dd>
        </div>
        <div className={styles.tile}>
          <dt>{t('medication.fields.atc')}</dt>
          <dd>
            {item.atcCode}
            <br />
            {localized(item.atcPath, lang)}
          </dd>
        </div>
        <div className={styles.tile}>
          <dt>{t('medication.fields.eof')}</dt>
          <dd>{item.eofChapter}</dd>
        </div>
        <div className={styles.tile}>
          <dt>{t('medication.fields.maNumber')}</dt>
          <dd>{item.maNumber}</dd>
        </div>
        <div className={styles.tile}>
          <dt>{t('medication.fields.maHolder')}</dt>
          <dd>{item.maHolder}</dd>
        </div>
      </dl>
    </div>
  )
}
