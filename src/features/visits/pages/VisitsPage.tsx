import { useTranslation } from 'react-i18next'
import { recordVisible, useScope } from '@/features/team'
import { useWatchSubtitle } from '@/features/team/useWatchSubtitle'
import { PageHeader } from '@/shared/ui'
import { VisitsTable } from '../components/VisitsTable'
import { useVisitRows } from '../queries'

export function VisitsPage() {
  const { t } = useTranslation()
  const { scopeRole, watched, focus } = useScope()
  const { rows, isLoading, error } = useVisitRows()
  const allowed = new Set(watched.map((member) => member.id))
  const visible = rows?.filter((visit) => recordVisible(visit.repId, focus, scopeRole, allowed))

  return (
    <section>
      <PageHeader title={t('visits.title')} subtitle={useWatchSubtitle('visits')} />
      <VisitsTable visits={visible} isLoading={isLoading} error={error} />
    </section>
  )
}
