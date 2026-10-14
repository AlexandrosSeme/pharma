import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth'
import { PageHeader, Select } from '@/shared/ui'
import { VisitsTable } from '../components/VisitsTable'
import { useVisitRows } from '../queries'

export function VisitsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { rows, isLoading, error } = useVisitRows()
  const [repId, setRepId] = useState('')
  const isRep = user?.role === 'rep'

  const reps = [...new Map(rows?.map((v) => [v.repId, v.repName])).entries()].toSorted((a, b) =>
    a[1].localeCompare(b[1]),
  )
  const visible = rows?.filter((v) => (isRep ? v.repId === user.id : !repId || v.repId === repId))

  return (
    <section>
      <PageHeader
        title={t('visits.title')}
        subtitle={t(isRep ? 'visits.subtitleRep' : 'visits.subtitle')}
        actions={
          !isRep && (
            <Select
              aria-label={t('visits.columns.rep')}
              value={repId}
              onChange={setRepId}
              options={[
                { value: '', label: t('visits.allReps') },
                ...reps.map(([value, label]) => ({ value, label })),
              ]}
            />
          )
        }
      />
      <VisitsTable visits={visible} isLoading={isLoading} error={error} />
    </section>
  )
}
