/** Exact name, otherwise the closest pack whose name contains the other. */
export function matchName<T>(name: string, items: T[], read: (item: T) => string): T | undefined {
  const exact = items.find((item) => read(item) === name)
  if (exact) return exact
  const key = compact(name)
  if (key.length < 6) return undefined
  let best: T | undefined
  let bestDelta = 18
  for (const item of items) {
    const other = compact(read(item))
    if (!other.includes(key) && !key.includes(other)) continue
    const delta = Math.abs(other.length - key.length)
    if (delta < bestDelta) {
      best = item
      bestDelta = delta
    }
  }
  return best
}

function compact(value: string) {
  return value
    .toLowerCase()
    .replace(/\b(inhaler|gel|syrup|nasal|spray|tablet|capsule|softgel|injection|chewable|effervescent)\b/g, '')
    .replace(/[^a-z0-9]+/g, '')
}
