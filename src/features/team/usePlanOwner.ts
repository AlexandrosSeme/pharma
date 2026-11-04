import { useScope } from './useScope'

/** The person a new plan, visit or presentation is saved under. */
export function usePlanOwner() {
  const { user, focus, watched } = useScope()
  if (focus?.kind === 'person') {
    const person = watched.find((member) => member.id === focus.id)
    if (person) return { id: person.id, name: person.name }
  }
  if (focus?.kind === 'team') {
    const lead = watched.find((member) => member.id === focus.managerId)
    if (lead) return { id: lead.id, name: lead.name }
  }
  return user ? { id: user.id, name: user.name } : null
}
