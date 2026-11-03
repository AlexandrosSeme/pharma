import { useTranslation } from 'react-i18next'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { ChartCard, LineChart } from '@/shared/ui/charts'
import type { Medication } from '../types'
import styles from '../components/Section.module.css'

export function MedicationPageHistory({ item }: { item: Medication }) {
  const { t } = useTranslation()
  const { formatMoney, formatMonth } = useFormatters()
  const latest = item.prices.at(-1)
  const previous = item.prices.at(-2)
  const change = latest && previous ? (latest.pharmacy - previous.pharmacy) / previous.pharmacy : 0
  const changeLabel =
    change === 0
      ? t('medication.prices.unchanged')
      : `${change > 0 ? '+' : ''}${(change * 100).toFixed(1)}%`

  return (
    <div>
      <div className={styles.prices}>
        <div className={styles.price}>
          <p className={styles.priceLabel}>{t('medication.prices.wholesale')}</p>
          <p className={styles.priceValue}>{latest ? formatMoney(latest.wholesale) : '—'}</p>
        </div>
        <div className={styles.price}>
          <p className={styles.priceLabel}>{t('medication.prices.pharmacy')}</p>
          <p className={styles.priceValue}>{latest ? formatMoney(latest.pharmacy) : '—'}</p>
        </div>
        <div className={styles.price}>
          <p className={styles.priceLabel}>{t('medication.prices.reimbursement')}</p>
          <p className={styles.priceValue}>
            {latest?.reimbursement != null ? formatMoney(latest.reimbursement) : t('medication.prices.notListed')}
          </p>
        </div>
        <div className={styles.price}>
          <p className={styles.priceLabel}>{t('medication.prices.change')}</p>
          <p className={`${styles.priceValue} ${change > 0 ? styles.up : styles.down}`}>{changeLabel}</p>
        </div>
      </div>
      <ChartCard title={t('medication.prices.chart')} subtitle={t('medication.prices.chartHint')} size="md">
        <LineChart
          ariaLabel={t('medication.prices.chart')}
          labels={item.prices.map((row) => formatMonth(row.month))}
          formatValue={formatMoney}
          series={[
            { label: t('medication.prices.pharmacy'), data: item.prices.map((row) => row.pharmacy) },
            { label: t('medication.prices.wholesale'), data: item.prices.map((row) => row.wholesale) },
            {
              label: t('medication.prices.reimbursement'),
              data: item.prices.map((row) => row.reimbursement ?? Number.NaN),
            },
          ]}
        />
      </ChartCard>
    </div>
  )
}
