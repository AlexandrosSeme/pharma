import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StatusBadge } from '@/shared/ui'
import { medicationSections } from '../lib/sections'
import { localized } from '../lib/text'
import { MedicationPageAdministration } from '../pages/MedicationPageAdministration'
import { MedicationPageAvailability } from '../pages/MedicationPageAvailability'
import { MedicationPageHistory } from '../pages/MedicationPageHistory'
import { MedicationPageInfo } from '../pages/MedicationPageInfo'
import { MedicationPagePrecautions } from '../pages/MedicationPagePrecautions'
import { MedicationPageSubstances } from '../pages/MedicationPageSubstances'
import type { Medication, MedicationTab } from '../types'
import styles from './MedicationPanel.module.css'

type MedicationPanelProps = {
  item: Medication
  onBack?: () => void
}

export function MedicationPanel({ item, onBack }: MedicationPanelProps) {
  const { t, i18n } = useTranslation()
  const [tab, setTab] = useState<MedicationTab>('info')
  const lang = i18n.resolvedLanguage
  const inn = lang?.startsWith('el') ? item.innEl : item.inn

  useEffect(() => {
    setTab('info')
  }, [item.id])

  return (
    <article className={styles.canvas}>
      <header className={styles.hero}>
        <span className={styles.watermark} aria-hidden="true">
          {item.atcCode.slice(0, 3)}
        </span>
        <div className={styles.heroTop}>
          {onBack && (
            <button type="button" className="btn btn-outline-secondary d-lg-none" onClick={onBack}>
              <i className="bi bi-arrow-left" aria-hidden="true" />
              <span className="visually-hidden">{t('medication.back')}</span>
            </button>
          )}
          <div className="min-w-0 flex-grow-1">
            <p className={styles.kicker}>{inn}</p>
            <h2 className={styles.title}>{item.tradeName}</h2>
            <div className={styles.chips}>
              <StatusBadge tone={item.availability.prescription ? 'info' : 'neutral'}>
                {t(item.availability.prescription ? 'medication.legal.rx' : 'medication.legal.otc')}
              </StatusBadge>
              {item.availability.eopyy && (
                <StatusBadge tone="info">{t('medication.availability.eopyy')}</StatusBadge>
              )}
              <StatusBadge>{item.atcCode}</StatusBadge>
            </div>
            <p className={styles.path}>
              <code>{item.atcCode}</code> · {localized(item.atcPath, lang)}
            </p>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <nav className={styles.nav} aria-label={t('medication.sections')}>
          {medicationSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={styles.navBtn}
              aria-current={tab === section.id || undefined}
              onClick={() => setTab(section.id)}
            >
              <i className={`bi ${section.icon}`} aria-hidden="true" />
              {t(`medication.tabs.${section.id}`)}
            </button>
          ))}
        </nav>

        <div className={styles.main}>
          <p className={styles.hint}>{t(`medication.hints.${tab}`)}</p>
          <div className={styles.scroll}>
            <div key={tab} className={styles.fade}>
              {tab === 'info' && <MedicationPageInfo item={item} />}
              {tab === 'substances' && <MedicationPageSubstances item={item} />}
              {tab === 'administration' && <MedicationPageAdministration item={item} />}
              {tab === 'availability' && <MedicationPageAvailability item={item} />}
              {tab === 'precautions' && <MedicationPagePrecautions item={item} />}
              {tab === 'prices' && <MedicationPageHistory item={item} />}
              <p className={styles.disclaimer}>{t('medication.disclaimer')}</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
