import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Customer } from '@/features/customers'
import { CheckInButton } from '@/features/visits'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { googleMaps } from '@/shared/lib/geo'
import { Dialog, IconDetails, StatusBadge, type BadgeTone, type IconDetail } from '@/shared/ui'
import { actionMinutes } from '../lib/activityStyle'
import { addMinutes } from '../lib/dates'
import { useCreateActivity, useDeleteActivity, useUpdateActivity } from '../queries'
import type { Activity, ActivityStatus, ActivityType, ActivityUpdate } from '../types'
import { ActionButtons } from './ActionButtons'
import { ActivityForm, type ActivityDraft, type ActivityFormValues } from './ActivityForm'
import styles from './ActivityDialog.module.css'

const statusTone: Record<ActivityStatus, BadgeTone> = {
  planned: 'accent',
  done: 'success',
  cancelled: 'neutral',
}

function ErrorAlert({ error }: { error: Error | null }) {
  const { t } = useTranslation()
  if (!error) return null
  return (
    <div className="alert alert-danger small mb-0 mt-3" role="alert">
      {t('common.error', { message: error.message })}
    </div>
  )
}

const Spinner = () => <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />

type ActivityEditDialogProps = {
  customers: Customer[]
  onClose: () => void
  /** Back to the details view; closes the dialog when omitted. */
  onCancel?: () => void
} & ({ activity: Activity; owner?: never; draft?: never } | { activity?: never; owner: Pick<Activity, 'repId' | 'repName'>; draft: ActivityDraft })

/** Creates an activity from `draft` for `owner`, or edits `activity`. */
export function ActivityEditDialog({ activity, owner, draft, customers, onClose, onCancel }: ActivityEditDialogProps) {
  const { t } = useTranslation()
  const formId = useId()
  const create = useCreateActivity()
  const update = useUpdateActivity()
  const saving = create.isPending || update.isPending

  const initial: ActivityDraft = activity
    ? { ...activity, start: new Date(activity.start), end: new Date(activity.end) }
    : draft!

  function save(values: ActivityFormValues) {
    if (activity) update.mutate({ id: activity.id, data: values }, { onSuccess: onCancel ?? onClose })
    else create.mutate({ ...values, ...owner!, status: 'planned' }, { onSuccess: onClose })
  }

  return (
    <Dialog
      title={t(activity ? 'calendar.editActivity' : 'calendar.newActivity')}
      onClose={onClose}
      footer={
        <>
          <button type="submit" form={formId} className="btn btn-primary" disabled={saving}>
            {saving && <Spinner />}
            {t(activity ? 'calendar.save' : 'calendar.create')}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={onCancel ?? onClose}>
            {t('calendar.discard')}
          </button>
        </>
      }
    >
      <ActivityForm id={formId} draft={initial} customers={customers} onSubmit={save} />
      <ErrorAlert error={create.error ?? update.error} />
    </Dialog>
  )
}

type DropActionDialogProps = {
  customer: Customer
  start: Date
  owner: Pick<Activity, 'repId' | 'repName'>
  onClose: () => void
}

/** Shown after a customer is dropped on a time: the rep picks which action it is. */
export function DropActionDialog({ customer, start, owner, onClose }: DropActionDialogProps) {
  const { t } = useTranslation()
  const { formatLongDate, formatTime } = useFormatters()
  const create = useCreateActivity()
  const [type, setType] = useState<ActivityType | null>(null)
  const [notes, setNotes] = useState('')
  const end = addMinutes(start, type ? actionMinutes[type] : actionMinutes.visit)

  function save() {
    if (!type) return
    create.mutate(
      {
        ...owner,
        type,
        customerId: customer.id,
        title: t(`calendar.defaultTitle.${type}`, { customer: customer.name }),
        start: start.toISOString(),
        end: addMinutes(start, actionMinutes[type]).toISOString(),
        status: 'planned',
        notes: notes.trim() || undefined,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog
      title={customer.name}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-primary" disabled={!type || create.isPending} onClick={save}>
            {create.isPending && <Spinner />}
            {t('calendar.create')}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            {t('calendar.discard')}
          </button>
        </>
      }
    >
      <p className={styles.when}>
        <i className="bi bi-clock" aria-hidden="true" />
        <span>
          {formatLongDate(start)}
          <span className={styles.time}>
            {formatTime(start.toISOString())}–{formatTime(end.toISOString())}
          </span>
        </span>
      </p>
      <p className={styles.choose}>{t('calendar.dropChoose')}</p>
      <ActionButtons variant="picker" label={t('calendar.fields.type')} value={type} onChange={setType} />
      <label className={styles.noteLabel}>
        {t('calendar.fields.notes')}
        <span className="text-body-secondary"> ({t('calendar.optional')})</span>
        <textarea
          className="form-control mt-1"
          rows={2}
          value={notes}
          placeholder={type ? t(`calendar.notesPlaceholder.${type}`) : ''}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <ErrorAlert error={create.error} />
    </Dialog>
  )
}

type ActivityDialogProps = {
  activity: Activity
  customers: Customer[]
  onClose: () => void
}

/** Details of an activity, with the actions a rep takes on it in the field. */
export function ActivityDialog({ activity: a, customers, onClose }: ActivityDialogProps) {
  const { t } = useTranslation()
  const { formatLongDate, formatTime } = useFormatters()
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view')
  const update = useUpdateActivity()
  const remove = useDeleteActivity()

  if (mode === 'edit') {
    return <ActivityEditDialog activity={a} customers={customers} onClose={onClose} onCancel={() => setMode('view')} />
  }

  if (mode === 'delete') {
    return (
      <Dialog
        title={t('calendar.deleteTitle')}
        onClose={onClose}
        footer={
          <>
            <button
              type="button"
              className="btn btn-danger"
              disabled={remove.isPending}
              onClick={() => remove.mutate(a.id, { onSuccess: onClose })}
            >
              {remove.isPending && <Spinner />}
              {t('calendar.delete')}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setMode('view')}>
              {t('calendar.keep')}
            </button>
          </>
        }
      >
        <p className="mb-0">{t('calendar.deleteConfirm', { title: a.title })}</p>
        <ErrorAlert error={remove.error} />
      </Dialog>
    )
  }

  const customer = customers.find((c) => c.id === a.customerId)
  const planned = a.status === 'planned'
  const change = (data: ActivityUpdate) => update.mutate({ id: a.id, data })

  function changeType(next: ActivityType | null) {
    if (!planned || !next || next === a.type) return
    const named = customer?.name
    const previous = named ? t(`calendar.defaultTitle.${a.type}`, { customer: named }) : t(`calendar.types.${a.type}`)
    const title = named ? t(`calendar.defaultTitle.${next}`, { customer: named }) : t(`calendar.types.${next}`)
    change({ type: next, title: a.title === previous ? title : a.title })
  }

  const details: IconDetail[] = [
    {
      icon: 'bi-clock',
      label: t('calendar.fields.date'),
      content: (
        <>
          {formatLongDate(new Date(a.start))}
          <br />
          {formatTime(a.start)}–{formatTime(a.end)}
        </>
      ),
    },
    { icon: 'bi-person-badge', label: t('visits.columns.rep'), content: a.repName },
  ]
  if (customer) {
    details.push(
      {
        icon: 'bi-building',
        label: t('calendar.fields.customer'),
        content: `${customer.address}, ${customer.postalCode} ${customer.city}`,
      },
      {
        icon: 'bi-person',
        label: t('customers.columns.contact'),
        content: (
          <>
            {customer.contactPerson}
            {' · '}
            <a href={`tel:${customer.phone.replace(/\s/g, '')}`} className="text-decoration-none text-nowrap">
              {customer.phone}
            </a>
          </>
        ),
      },
    )
  }
  if (a.notes) {
    details.push({
      icon: 'bi-journal-text',
      label: t('calendar.fields.notes'),
      content: <span className={styles.notes}>{a.notes}</span>,
    })
  }

  return (
    <Dialog
      title={customer?.name ?? a.title}
      onClose={onClose}
      footer={
        <>
          {planned ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={update.isPending}
              onClick={() => change({ status: 'done' })}
            >
              <i className="bi bi-check2-circle me-2" aria-hidden="true" />
              {t('calendar.markDone')}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-outline-primary"
              disabled={update.isPending}
              onClick={() => change({ status: 'planned' })}
            >
              <i className="bi bi-arrow-counterclockwise me-2" aria-hidden="true" />
              {t('calendar.reopen')}
            </button>
          )}
          {planned && (
            <button type="button" className="btn btn-outline-secondary" onClick={() => setMode('edit')}>
              <i className="bi bi-pencil me-2" aria-hidden="true" />
              {t('calendar.edit')}
            </button>
          )}
          <div className={styles.quiet}>
            {planned && (
              <button
                type="button"
                className="btn btn-link link-secondary text-decoration-none"
                disabled={update.isPending}
                onClick={() => change({ status: 'cancelled' })}
              >
                {t('calendar.cancelActivity')}
              </button>
            )}
            <button
              type="button"
              className="btn btn-outline-danger"
              aria-label={t('calendar.delete')}
              title={t('calendar.delete')}
              onClick={() => setMode('delete')}
            >
              <i className="bi bi-trash" aria-hidden="true" />
            </button>
          </div>
        </>
      }
    >
      <div className={styles.head}>
        <ActionButtons
          variant="picker"
          label={t('calendar.fields.type')}
          value={a.type}
          allowEmpty={false}
          readOnly={!planned}
          onChange={changeType}
        />
        <div className={styles.meta}>
          <StatusBadge tone={statusTone[a.status]}>{t(`calendar.status.${a.status}`)}</StatusBadge>
          {a.visitId && <span className={styles.checked}>{t('calendar.checkedIn')}</span>}
        </div>
      </div>

      <IconDetails items={details} className="mb-0" />

      {planned && a.type === 'visit' && customer && (
        <CheckInButton
          className="mt-3"
          customer={customer}
          onCheckedIn={(visit) => change({ status: 'done', visitId: visit.id })}
        />
      )}
      {customer && (
        <a
          href={googleMaps.directions(`${customer.address}, ${customer.postalCode} ${customer.city}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline-primary w-100 mt-3"
        >
          <i className="bi bi-sign-turn-right me-2" aria-hidden="true" />
          {t('customers.directions')}
        </a>
      )}
      <ErrorAlert error={update.error} />
    </Dialog>
  )
}
