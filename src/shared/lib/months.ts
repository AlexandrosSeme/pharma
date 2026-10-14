/** Month keys are `YYYY-MM` strings in UTC. */
export function toMonthKey(iso: string) {
  return iso.slice(0, 7)
}

export function lastMonthKeys(count: number, end = new Date()) {
  const keys: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1))
    keys.push(d.toISOString().slice(0, 7))
  }
  return keys
}

export function yearToDateMonthKeys(end = new Date()) {
  return lastMonthKeys(end.getUTCMonth() + 1, end)
}
