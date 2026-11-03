import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { FilterChips, SearchInput } from '@/shared/ui'
import { MedicationList } from '../components/MedicationList'
import { MedicationPanel } from '../components/MedicationPanel'
import { atcCounts, atcLetter } from '../lib/atcGroups'
import { atcTone } from '../lib/atcStyle'
import { useMedications } from '../queries'
import styles from './MedicationPage.module.css'

export function MedicationPage() {
  const { t } = useTranslation()
  const { productId } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useMedications()
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState<string | null>(null)
  const term = useDebounce(search).trim().toLowerCase()
  const all = data ?? []
  const rows = useMemo(() => {
    return all.filter((item) => {
      if (group && atcLetter(item.atcCode) !== group) return false
      if (!term) return true
      return [item.tradeName, item.inn, item.innEl, item.atcCode].join(' ').toLowerCase().includes(term)
    })
  }, [all, group, term])
  const selected =
    rows.find((item) => String(item.id) === productId) ?? all.find((item) => String(item.id) === productId)
  const hideList = Boolean(productId)
  const chips = [
    { value: null, label: t('medication.atcAll'), count: all.length },
    ...atcCounts(all).map(([letter, count]) => ({
      value: letter,
      label: t(`medication.atc.${letter}`, { defaultValue: letter }),
      count,
      color: atcTone(letter),
    })),
  ]

  return (
    <section className={styles.page}>
      {isLoading && (
        <div className="d-flex align-items-center gap-2 py-3 text-body-secondary">
          <div className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
          {t('common.loading')}
        </div>
      )}
      {error && (
        <div className="alert alert-danger mb-0" role="alert">
          {t('common.error', { message: error.message })}
        </div>
      )}

      {!isLoading && !error && (
        <div className={styles.workspace}>
          <aside className={`${styles.catalog} ${hideList ? 'd-none d-lg-flex' : ''}`}>
            <div className={styles.catalogHead}>
              <p className={styles.kicker}>{t('medication.kicker')}</p>
              <h1 className={styles.title}>{t('medication.title')}</h1>
              <p className={styles.count}>{t('medication.catalogCount', { count: rows.length })}</p>
              <div className={styles.search}>
                <SearchInput value={search} onChange={setSearch} placeholder={t('medication.searchPlaceholder')} />
              </div>
              <div className={styles.chips}>
                <FilterChips
                  aria-label={t('medication.atcFilter')}
                  chips={chips}
                  value={group}
                  onChange={setGroup}
                />
              </div>
            </div>
            <div className={styles.list}>
              {rows.length ? (
                <MedicationList
                  items={rows}
                  selectedId={productId}
                  onSelect={(id) => navigate(`/medication/${id}`)}
                />
              ) : (
                <p className="text-body-secondary mb-0 px-2">{t('common.empty')}</p>
              )}
            </div>
          </aside>

          <div className={`${styles.detail} ${productId ? '' : 'd-none d-lg-flex'}`}>
            {selected ? (
              <MedicationPanel item={selected} onBack={() => navigate('/medication')} />
            ) : (
              <div className={styles.empty}>
                <span className={styles.emptyIcon} aria-hidden="true">
                  <i className="bi bi-journal-medical" />
                </span>
                <p className={styles.emptyTitle}>{t('medication.selectProduct')}</p>
                <p className={styles.emptyHint}>{t('medication.emptyHint')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
