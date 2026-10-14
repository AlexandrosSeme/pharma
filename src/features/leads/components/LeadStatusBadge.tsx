import { useTranslation } from 'react-i18next'
import { StatusBadge } from '@/shared/ui'
import { leadStatusTone } from '../status'
import type { LeadStatus } from '../types'

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const { t } = useTranslation()
  return <StatusBadge tone={leadStatusTone[status]}>{t(`leads.status.${status}`)}</StatusBadge>
}
