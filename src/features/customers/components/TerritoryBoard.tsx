import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCustomers } from '@/features/customers/queries'
import { canSeeCustomer, useScope, type TeamMember } from '@/features/team'
import { accountsInTerritory, territoryName, type Territory } from '@/features/territories'
import type { Customer } from '../types'
import { TerritoryDialog } from './TerritoryDialog'
import styles from './TerritoryBoard.module.css'

type TerritoryBoardProps = {
  territories: Territory[]
  customers: Customer[]
  reps: TeamMember[]
  /** Login role, so watching a person does not hide the control. */
  canManage: boolean
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function TerritoryBoard({ territories, customers, reps, canManage, selectedId, onSelect }: TerritoryBoardProps) {
  const { t, i18n } = useTranslation()
  const { user, role } = useScope()
  const all = useCustomers()
  const [draft, setDraft] = useState<{ rep: TeamMember; territory?: Territory } | null>(null)
  const lang = i18n.resolvedLanguage
  const pool = (all.data ?? []).filter((account) => user && canSeeCustomer(account, user.id, role))
  const single = reps.length === 1
  const selected = territories.find((territory) => territory.id === selectedId)

  if (reps.length === 0) return null

  return (
    <section className={styles.board} aria-labelledby="customer-territories">
      <div className={styles.head}>
        <div>
          <h2 id="customer-territories">{t('customers.territories.title')}</h2>
          {canManage && <p>{t('customers.territories.hint')}</p>}
        </div>
        {canManage && single && (
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setDraft({ rep: reps[0] })}>
            <i className="bi bi-plus-lg me-1" aria-hidden="true" />
            {t('customers.territories.add')}
          </button>
        )}
      </div>
      <div className={styles.rows}>
        {reps.map((rep) => {
          const bricks = territories.filter((territory) => territory.repId === rep.id)
          return (
            <div key={rep.id} className={styles.row}>
              {!single && <h3 className={styles.rep}>{rep.name}</h3>}
              <div className={styles.parcels}>
                {bricks.length === 0 && <p className={styles.none}>{t('customers.territories.none')}</p>}
                {bricks.map((territory) => {
                  const name = territoryName(territory.name, lang)
                  const mine = accountsInTerritory(territory, customers)
                  const cities = [...new Set(mine.map((account) => account.city))]
                  const place = (cities.length ? cities : territory.cities).join(', ')
                  const on = selectedId === territory.id
                  return (
                    <span key={territory.id} className={on ? `${styles.parcel} ${styles.on}` : styles.parcel}>
                      <button
                        type="button"
                        className={styles.parcelMain}
                        aria-pressed={on}
                        title={place}
                        onClick={() => onSelect(on ? null : territory.id)}
                      >
                        <span className={styles.parcelName}>{name}</span>
                        <span className={styles.parcelMeta}>
                          {t('customers.territories.accounts', { count: mine.length })}
                          {place && (
                            <>
                              <span aria-hidden="true"> · </span>
                              {place}
                            </>
                          )}
                        </span>
                      </button>
                      {canManage && (
                        <button
                          type="button"
                          className={styles.edit}
                          aria-label={t('customers.territories.edit', { name })}
                          onClick={() => setDraft({ rep, territory })}
                        >
                          <i className="bi bi-pencil" aria-hidden="true" />
                        </button>
                      )}
                    </span>
                  )
                })}
              </div>
              {canManage && !single && (
                <button
                  type="button"
                  className={`btn btn-sm btn-outline-primary ${styles.add}`}
                  onClick={() => setDraft({ rep })}
                >
                  <i className="bi bi-plus-lg" aria-hidden="true" />
                  {t('customers.territories.add')}
                </button>
              )}
            </div>
          )
        })}
      </div>
      {selected && (
        <p className={styles.showing}>
          {t('customers.territories.showing', { name: territoryName(selected.name, lang) })}
          <button type="button" className={styles.clear} onClick={() => onSelect(null)}>
            {t('customers.territories.showAll')}
          </button>
        </p>
      )}
      {draft && (
        <TerritoryDialog
          rep={draft.rep}
          territory={draft.territory}
          territories={territories}
          accounts={pool}
          onClose={() => setDraft(null)}
        />
      )}
    </section>
  )
}
