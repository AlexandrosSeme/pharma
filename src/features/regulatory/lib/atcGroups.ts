import type { Medication } from '../types'

export function atcLetter(code: string) {
  return code.charAt(0)
}

export function atcCounts(items: Medication[]) {
  const counts = new Map<string, number>()
  for (const item of items) {
    const letter = atcLetter(item.atcCode)
    counts.set(letter, (counts.get(letter) ?? 0) + 1)
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b))
}
