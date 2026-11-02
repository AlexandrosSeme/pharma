import { useId, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Customer } from '@/features/customers'
import { activityStyle } from '../lib/activityStyle'
import { addMinutes, fromInputs, toDateInput, toTimeInput } from '../lib/dates'
import { activityTypes, type ActivityType } from '../types'

export type ActivityDraft = {
  type: ActivityType
  customerId?: string
  title: string
  start: Date
  end: Date
  notes?: string
}

export type ActivityFormValues = Omit<ActivityDraft, 'start' | 'end'> & { start: string; end: string }

type ActivityFormProps = {
  id: string
  draft: ActivityDraft
  customers: Customer[]
  onSubmit: (values: ActivityFormValues) => void
}

/** Matches the calendar's 15-minute rows. */
const MIN_MINUTES = 15

type Errors = Partial<Record<'customerId' | 'end', string>>

export function ActivityForm({ id, draft, customers, onSubmit }: ActivityFormProps) {
  const { t } = useTranslation()
  const fieldId = useId()
  const [type, setType] = useState(draft.type)
  const [customerId, setCustomerId] = useState(draft.customerId ?? '')
  const [title, setTitle] = useState(draft.title)
  const [date, setDate] = useState(toDateInput(draft.start))
  const [startTime, setStartTime] = useState(toTimeInput(draft.start))
  const [endTime, setEndTime] = useState(toTimeInput(draft.end))
  const [notes, setNotes] = useState(draft.notes ?? '')
  const [errors, setErrors] = useState<Errors>({})

  const customer = customers.find((c) => c.id === customerId)
  const defaultTitle = customer
    ? t(`calendar.defaultTitle.${type}`, { customer: customer.name })
    : t(`calendar.types.${type}`)

  const cities = new Map<string, Customer[]>()
  for (const c of customers.toSorted((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name))) {
    cities.set(c.city, [...(cities.get(c.city) ?? []), c])
  }

  function changeStart(value: string) {
    if (value && startTime && endTime) {
      const duration = (fromInputs(date, endTime).getTime() - fromInputs(date, startTime).getTime()) / 60_000
      if (duration > 0) setEndTime(toTimeInput(addMinutes(fromInputs(date, value), duration)))
    }
    setStartTime(value)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const start = fromInputs(date, startTime)
    const end = fromInputs(date, endTime)
    const next: Errors = {}
    if (type === 'visit' && !customerId) next.customerId = t('calendar.errors.customer')
    if (!(end.getTime() - start.getTime() >= MIN_MINUTES * 60_000)) next.end = t('calendar.errors.end', { minutes: MIN_MINUTES })
    setErrors(next)
    if (Object.keys(next).length) return

    onSubmit({
      type,
      customerId: customerId || undefined,
      title: title.trim() || defaultTitle,
      start: start.toISOString(),
      end: end.toISOString(),
      notes: notes.trim() || undefined,
    })
  }

  return (
    <form id={id} noValidate onSubmit={submit} className="d-grid gap-3">
      <fieldset>
        <legend className="form-label fs-6">{t('calendar.fields.type')}</legend>
        <div className="row g-2">
          {activityTypes.map((value) => (
            <div key={value} className="col-6 col-sm-3">
              <input
                id={`${fieldId}-type-${value}`}
                type="radio"
                className="btn-check"
                name={`${fieldId}-type`}
                value={value}
                checked={value === type}
                onChange={() => setType(value)}
              />
              <label htmlFor={`${fieldId}-type-${value}`} className="btn btn-outline-primary w-100 text-nowrap">
                <i className={`bi ${activityStyle[value].icon} me-1`} aria-hidden="true" />
                {t(`calendar.types.${value}`)}
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor={`${fieldId}-customer`} className="form-label">
          {t('calendar.fields.customer')}
          {type !== 'visit' && <span className="text-body-secondary"> ({t('calendar.optional')})</span>}
        </label>
        <select
          id={`${fieldId}-customer`}
          className={`form-select ${errors.customerId ? 'is-invalid' : ''}`}
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          aria-describedby={errors.customerId ? `${fieldId}-customer-error` : undefined}
        >
          <option value="">{t('calendar.noCustomer')}</option>
          {[...cities].map(([city, list]) => (
            <optgroup key={city} label={city}>
              {list.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {errors.customerId && (
          <div id={`${fieldId}-customer-error`} className="invalid-feedback">
            {errors.customerId}
          </div>
        )}
      </div>

      <div>
        <label htmlFor={`${fieldId}-title`} className="form-label">
          {t('calendar.fields.title')}
        </label>
        <input
          id={`${fieldId}-title`}
          className="form-control"
          value={title}
          placeholder={defaultTitle}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="row g-3">
        <div className="col-12 col-sm-6">
          <label htmlFor={`${fieldId}-date`} className="form-label">
            {t('calendar.fields.date')}
          </label>
          <input
            id={`${fieldId}-date`}
            type="date"
            className="form-control"
            required
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
        </div>
        <div className="col-6 col-sm-3">
          <label htmlFor={`${fieldId}-start`} className="form-label">
            {t('calendar.fields.start')}
          </label>
          <input
            id={`${fieldId}-start`}
            type="time"
            step={900}
            className="form-control"
            required
            value={startTime}
            onChange={(e) => changeStart(e.target.value)}
          />
        </div>
        <div className="col-6 col-sm-3">
          <label htmlFor={`${fieldId}-end`} className="form-label">
            {t('calendar.fields.end')}
          </label>
          <input
            id={`${fieldId}-end`}
            type="time"
            step={900}
            className={`form-control ${errors.end ? 'is-invalid' : ''}`}
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            aria-describedby={errors.end ? `${fieldId}-end-error` : undefined}
          />
        </div>
        {errors.end && (
          <div id={`${fieldId}-end-error`} className="col-12 mt-1 small text-danger">
            {errors.end}
          </div>
        )}
      </div>

      <div>
        <label htmlFor={`${fieldId}-notes`} className="form-label">
          {t('calendar.fields.notes')}
          <span className="text-body-secondary"> ({t('calendar.optional')})</span>
        </label>
        <textarea
          id={`${fieldId}-notes`}
          className="form-control"
          rows={3}
          value={notes}
          placeholder={t(`calendar.notesPlaceholder.${type}`)}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </form>
  )
}
