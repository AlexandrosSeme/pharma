import { useTranslation } from 'react-i18next'
import { localized } from '../lib/text'
import type { Medication } from '../types'
import styles from '../components/Section.module.css'

export function MedicationPageAvailability({ item }: { item: Medication }) {
  const { t, i18n } = useTranslation()
  const channels = [
    {
      on: item.availability.prescription,
      icon: 'bi-prescription2',
      label: t('medication.legal.rx'),
    },
    {
      on: !item.availability.prescription,
      icon: 'bi-basket',
      label: t('medication.legal.otc'),
    },
    {
      on: item.availability.retail,
      icon: 'bi-shop',
      label: t('medication.availability.retail'),
    },
    {
      on: item.availability.hospital,
      icon: 'bi-hospital',
      label: t('medication.availability.hospital'),
    },
    {
      on: item.availability.eopyy,
      icon: 'bi-card-checklist',
      label: t('medication.availability.eopyy'),
    },
  ]

  return (
    <div>
      <div className={styles.channels}>
        {channels.map((channel) => (
          <div key={channel.label} className={`${styles.channel} ${channel.on ? styles.channelOn : ''}`}>
            <span className={styles.channelIcon} aria-hidden="true">
              <i className={`bi ${channel.icon}`} />
            </span>
            <div>
              <p className={styles.channelTitle}>{channel.label}</p>
              <p className={styles.channelState}>
                {t(channel.on ? 'medication.availability.on' : 'medication.availability.off')}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className={styles.note}>{localized(item.availability.note, i18n.resolvedLanguage)}</p>
    </div>
  )
}
