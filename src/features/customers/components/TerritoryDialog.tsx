import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { memberById, type TeamMember } from '@/features/team'
import {
  accountIdsOf,
  accountsInTerritory,
  territoryForAccount,
  territoryName,
  useRemoveTerritory,
  useSaveTerritory,
  type Territory,
} from '@/features/territories'
import { Dialog, SearchInput } from '@/shared/ui'
import type { Customer } from '../types'
import styles from './TerritoryDialog.module.css'

type TerritoryDialogProps = {
  rep: TeamMember
  territory?: Territory
  territories: Territory[]
  accounts: Customer[]
  onClose: () => void
}

export function TerritoryDialog({ rep, territory, territories, accounts, onClose }: TerritoryDialogProps) {
  const { t, i18n } = useTranslation()
  const formId = useId()
  const lang = i18n.resolvedLanguage
  const save = useSaveTerritory()
  const remove = useRemoveTerritory()
  const [name, setName] = useState(() => (territory ? territoryName(territory.name, lang) : ''))
  const [picked, setPicked] = useState<string[]>(() => {
    if (!territory) return []
    const fromPool = accountsInTerritory(territory, accounts).map((account) => String(account.id))
    return [...new Set([...accountIdsOf(territory), ...fromPool])]
  })
  const [search, setSearch] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const pending = save.isPending || remove.isPending
  const term = search.trim().toLowerCase()

  const visible = useMemo(
    () =>
      accounts
        .filter(
          (account) =>
            !term ||
            [account.name, account.city, account.contactPerson, account.type].some((field) =>
              field.toLowerCase().includes(term),
            ),
        )
        .toSorted((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name)),
    [accounts, term],
  )

  const byCity = useMemo(() => {
    const groups: { city: string; accounts: Customer[] }[] = []
    for (const account of visible) {
      const last = groups.at(-1)
      if (last?.city === account.city) last.accounts.push(account)
      else groups.push({ city: account.city, accounts: [account] })
    }
    return groups
  }, [visible])

  const pickedSet = new Set(picked)

  function toggle(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function toggleCity(cityAccounts: Customer[]) {
    const ids = cityAccounts.map((account) => String(account.id))
    const allOn = ids.every((id) => pickedSet.has(id))
    setPicked((current) =>
      allOn ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])],
    )
  }

  function submit() {
    const trimmed = name.trim()
    if (!trimmed || picked.length === 0 || pending) return
    const nextName = territory
      ? lang?.startsWith('el')
        ? { ...territory.name, el: trimmed }
        : { ...territory.name, en: trimmed }
      : { en: trimmed, el: trimmed }
    save.mutate(
      { id: territory?.id, rep, name: nextName, accountIds: picked, territories, customers: accounts },
      { onSuccess: onClose },
    )
  }

  function drop() {
    if (!territory || pending) return
    if (!confirmRemove) {
      setConfirmRemove(true)
      return
    }
    remove.mutate(territory.id, { onSuccess: onClose })
  }

  return (
    <Dialog
      wide
      title={t(territory ? 'customers.territories.editTitle' : 'customers.territories.newTitle')}
      onClose={onClose}
      footer={
        <>
          <span className="me-auto small text-body-secondary align-self-center">
            {t('customers.territories.selected', { count: picked.length })}
          </span>
          <button
            type="submit"
            form={formId}
            className="btn btn-primary"
            disabled={pending || !name.trim() || picked.length === 0}
          >
            {pending ? t('common.loading') : t('customers.territories.save')}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={pending}>
            {t('customers.territories.cancel')}
          </button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <p className={styles.for}>{t('customers.territories.forRep', { name: rep.name })}</p>
        <label className={styles.label} htmlFor={`${formId}-name`}>
          {t('customers.territories.name')}
        </label>
        <input
          id={`${formId}-name`}
          className="form-control"
          value={name}
          placeholder={t('customers.territories.namePlaceholder')}
          autoFocus
          autoComplete="off"
          onChange={(event) => setName(event.target.value)}
        />
        <p className={styles.pick}>{t('customers.territories.pick')}</p>
        <div className={styles.search}>
          <SearchInput value={search} onChange={setSearch} placeholder={t('customers.territories.search')} />
        </div>
        <div className={styles.list}>
          {byCity.length === 0 ? (
            <p className={styles.empty}>{t('customers.territories.emptyPick')}</p>
          ) : (
            byCity.map((group) => {
              const ids = group.accounts.map((account) => String(account.id))
              const allOn = ids.every((id) => pickedSet.has(id))
              return (
                <div key={group.city}>
                  <CityCheck
                    checked={allOn}
                    indeterminate={!allOn && ids.some((id) => pickedSet.has(id))}
                    label={group.city}
                    onChange={() => toggleCity(group.accounts)}
                  />
                  <ul>
                    {group.accounts.map((account) => {
                      const id = String(account.id)
                      const owner = account.repId ? memberById(account.repId) : undefined
                      const home = territoryForAccount(
                        territories.filter((item) => item.id !== territory?.id),
                        account,
                      )
                      const note = home
                        ? t('customers.territories.moves', { territory: territoryName(home.name, lang) })
                        : owner && owner.id !== rep.id
                          ? t('customers.territories.withRep', { name: owner.name })
                          : ''
                      return (
                        <li key={id}>
                          <label className={styles.account}>
                            <input type="checkbox" checked={pickedSet.has(id)} onChange={() => toggle(id)} />
                            <span>
                              <span className={styles.accountName}>{account.name}</span>
                              <span className={styles.accountMeta}>
                                {t(`customers.types.${account.type}`)}
                                {note && (
                                  <>
                                    <span aria-hidden="true"> · </span>
                                    {note}
                                  </>
                                )}
                              </span>
                            </span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })
          )}
        </div>
        {territory && (
          <div className={styles.removeRow}>
            <button type="button" className={styles.remove} disabled={pending} onClick={drop}>
              {t(confirmRemove ? 'customers.territories.removeConfirm' : 'customers.territories.remove')}
            </button>
            {confirmRemove && <span>{t('customers.territories.kept', { name: rep.name })}</span>}
          </div>
        )}
        {save.isError && <p className={styles.fail}>{t('customers.territories.saveFailed')}</p>}
      </form>
    </Dialog>
  )
}

function CityCheck({
  checked,
  indeterminate,
  label,
  onChange,
}: {
  checked: boolean
  indeterminate: boolean
  label: string
  onChange: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])
  return (
    <label className={styles.city}>
      <input ref={ref} type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  )
}
