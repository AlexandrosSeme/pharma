import { useId, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import type { Customer } from '@/features/customers'
import { CheckInButton } from '@/features/visits'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { googleMaps } from '@/shared/lib/geo'
import { Dialog, IconDetails, StatusBadge, type BadgeTone, type IconDetail } from '@/shared/ui'
import { activityStyle } from '../lib/activityStyle'
import { useCreateActivity, useDeleteActivity, useUpdateActivity } from '../queries'
import type { Activity, ActivityStatus, ActivityUpdate } from '../types'
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
  const style = activityStyle[a.type]
  const planned = a.status === 'planned'
  const change = (data: ActivityUpdate) => update.mutate({ id: a.id, data })

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
        content: (
          <>
            <span className="fw-medium text-body-emphasis">{customer.name}</span>
            <br />
            {customer.address}, {customer.postalCode} {customer.city}
          </>
        ),
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
      title={a.title}
      onClose={onClose}
      footer={
        <>
          {planned && a.type === 'visit' && customer && (
            <CheckInButton
              customer={customer}
              onCheckedIn={(visit) => change({ status: 'done', visitId: visit.id })}
            />
          )}
          {planned ? (
            <button
              type="button"
              className="btn btn-outline-primary"
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
          <div className="d-flex flex-wrap gap-2 ms-auto">
            {planned && (
              <button
                type="button"
                className="btn btn-outline-secondary"
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
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <span className={styles.type} style={{ '--type-color': style.color } as CSSProperties}>
          <i className={`bi ${style.icon}`} aria-hidden="true" />
          {t(`calendar.types.${a.type}`)}
        </span>
        <StatusBadge tone={statusTone[a.status]}>{t(`calendar.status.${a.status}`)}</StatusBadge>
        {a.visitId && (
          <span className="small text-body-secondary">
            <i className="bi bi-person-check me-1" aria-hidden="true" />
            {t('calendar.checkedIn')}
          </span>
        )}
      </div>

      <IconDetails items={details} className="mb-0" />

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
