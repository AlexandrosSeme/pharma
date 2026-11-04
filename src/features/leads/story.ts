import type { Lead, LeadEvent } from './types'

const day = 86_400_000

const kindOrder: Record<LeadEvent['kind'], number> = {
  opened: 0,
  status: 1,
  note: 2,
  call: 3,
}

/**
 * The opening line is the lead's real date and the note on file.
 * Later lines exist only once someone moves the stage or writes what was said.
 */
export function leadStory(lead: Lead): LeadEvent[] {
  const source = lead.events?.length
    ? lead.events
    : [
        {
          id: 'opened',
          kind: 'opened' as const,
          at: lead.createdAt,
          text: lead.notes.trim() || undefined,
        },
      ]
  return [...source].sort((a, b) => {
    const byTime = a.at.localeCompare(b.at)
    return byTime === 0 ? kindOrder[a.kind] - kindOrder[b.kind] : byTime
  })
}

export function daysSince(iso: string) {
  const start = new Date(iso)
  const today = new Date()
  const from = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const to = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.max(0, Math.round((to - from) / day))
}

/** When the lead was moved to the stage it is on. Unknown until that move is recorded. */
export function arrivedAt(lead: Lead, story: LeadEvent[]) {
  for (let i = story.length - 1; i >= 0; i -= 1) {
    const event = story[i]
    if (event.kind === 'status' && event.status === lead.status) return event.at
  }
  return null
}
