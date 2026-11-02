const pad = (n: number) => String(n).padStart(2, '0')

/** `YYYY-MM-DD` in local time, for <input type="date">. */
export const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** `HH:mm` in local time, for <input type="time">. */
export const toTimeInput = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

export const fromInputs = (date: string, time: string) => new Date(`${date}T${time}`)

export const isSameDay = (a: Date, b: Date) => toDateInput(a) === toDateInput(b)

export const addMinutes = (d: Date, minutes: number) => new Date(d.getTime() + minutes * 60_000)

const DAY_START_HOUR = 9
const DAY_END_HOUR = 18

/** Next quarter hour from now; outside working hours, the next morning at 09:00. */
export function defaultStart(from = new Date()) {
  const d = new Date(from)
  d.setSeconds(0, 0)
  d.setMinutes(Math.ceil((d.getMinutes() + 1) / 15) * 15)
  if (d.getHours() >= DAY_END_HOUR) d.setDate(d.getDate() + 1)
  if (d.getHours() >= DAY_END_HOUR || d.getHours() < DAY_START_HOUR - 1) d.setHours(DAY_START_HOUR, 0)
  return d
}
