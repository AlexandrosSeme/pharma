import type { Localized } from '../types'

export function localized(value: Localized | undefined, lang: string | undefined) {
  if (!value) return ''
  return lang?.startsWith('el') ? value.el : value.en
}

export function daysUntil(isoDate: string, now = new Date()) {
  const end = new Date(`${isoDate}T23:59:59`)
  return Math.ceil((end.getTime() - now.getTime()) / 86_400_000)
}

export function isExpiring(isoDate: string, withinDays: number, now = new Date()) {
  const days = daysUntil(isoDate, now)
  return days >= 0 && days <= withinDays
}

export function isExpired(isoDate: string, now = new Date()) {
  return daysUntil(isoDate, now) < 0
}

export function formatClock(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}
