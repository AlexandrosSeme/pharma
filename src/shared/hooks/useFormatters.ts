import { useTranslation } from 'react-i18next'

const locales: Record<string, string> = {
  en: 'en-GB',
  el: 'el-GR',
}

export function useFormatters() {
  const { i18n } = useTranslation()
  const locale = locales[i18n.resolvedLanguage ?? 'en'] ?? 'en-GB'

  const money = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' })
  const moneyCompact = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 1,
  })
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })
  const longDate = new Intl.DateTimeFormat(locale, { dateStyle: 'full' })
  const month = new Intl.DateTimeFormat(locale, { month: 'short', year: '2-digit', timeZone: 'UTC' })
  const number = new Intl.NumberFormat(locale)
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 })

  return {
    formatMoney: (value: number) => money.format(value),
    formatMoneyCompact: (value: number) => moneyCompact.format(value),
    formatDate: (iso: string) => date.format(new Date(iso)),
    formatLongDate: (value: Date) => longDate.format(value),
    /** `monthKey` is `YYYY-MM`. */
    formatMonth: (monthKey: string) => month.format(new Date(`${monthKey}-01T00:00:00Z`)),
    formatNumber: (value: number) => number.format(value),
    formatPercent: (ratio: number) => percent.format(ratio),
  }
}
