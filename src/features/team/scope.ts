import { roster } from './roster'
import type { Role, TeamMember } from './types'

export function normalizeRole(role?: string): Role {
  if (role === 'director' || role === 'admin') return 'director'
  if (role === 'manager') return 'manager'
  return 'rep'
}

/** Director: everyone. Manager: self and the reps who report to them. Rep: self. */
export function visibleMembers(userId: string, role: Role): TeamMember[] {
  if (role === 'director') return roster
  if (role === 'manager') return roster.filter((member) => member.id === userId || member.managerId === userId)
  return roster.filter((member) => member.id === userId)
}

export function canSeeCustomer(customer: { repId?: string }, userId: string, role: Role) {
  if (role === 'director') return true
  if (!customer.repId) return false
  if (role === 'rep') return customer.repId === userId
  return roster.some(
    (member) => member.role === 'rep' && member.managerId === userId && member.id === customer.repId,
  )
}

export function canSeeName(role: Role, members: TeamMember[], name: string) {
  if (role === 'director') return true
  return members.some((member) => member.name === name)
}

export function nameVisible(name: string, focus: WatchFocus | null, scopeRole: Role, watched: TeamMember[]) {
  if (focus?.kind === 'person') return watched.some((member) => member.id === focus.id && member.name === name)
  return canSeeName(scopeRole, watched, name)
}

/** One selected person keeps their own activities, even when that person is the director. */
export function recordVisible(
  repId: string,
  focus: WatchFocus | null,
  scopeRole: Role,
  watchedIds: Set<string>,
) {
  if (focus?.kind === 'person') return repId === focus.id
  if (scopeRole === 'director') return true
  return watchedIds.has(repId)
}

export type WatchFocus = { kind: 'person'; id: string } | { kind: 'team'; managerId: string }

/** The people whose records are on screen. A focus narrows the login's own scope. */
export function watchedMembers(viewerId: string, role: Role, focus: WatchFocus | null): TeamMember[] {
  const allowed = visibleMembers(viewerId, role)
  if (!focus) return allowed
  if (focus.kind === 'person') {
    const person = allowed.find((member) => member.id === focus.id)
    return person ? [person] : allowed
  }
  const team = allowed.filter((member) => member.id === focus.managerId || member.managerId === focus.managerId)
  return team.length > 0 ? team : allowed
}

export function watchRole(loginRole: Role, focus: WatchFocus | null, watched: TeamMember[]): Role {
  if (!focus) return loginRole
  if (focus.kind === 'team') return 'manager'
  return watched.find((member) => member.id === focus.id)?.role ?? watched[0]?.role ?? loginRole
}

export function watchUserId(viewerId: string, focus: WatchFocus | null) {
  if (!focus) return viewerId
  return focus.kind === 'person' ? focus.id : focus.managerId
}

export function territoryText(member: TeamMember, lang?: string) {
  return lang?.startsWith('el') ? member.territory.el : member.territory.en
}

export type AccountGroup = {
  id: string
  /** Set for the director group. Team groups use `lead` instead. */
  role?: Role
  lead?: TeamMember
  members: TeamMember[]
}

/** Login groups. A director sees every group, a manager only their own team, a rep none. */
export function accountGroups(viewer?: { id: string; role: Role } | null): AccountGroup[] {
  const directors: AccountGroup = {
    id: 'directors',
    role: 'director',
    members: roster.filter((member) => member.role === 'director'),
  }
  const teams: AccountGroup[] = roster
    .filter((member) => member.role === 'manager')
    .map((manager) => ({
      id: manager.id,
      lead: manager,
      members: [manager, ...roster.filter((member) => member.role === 'rep' && member.managerId === manager.id)],
    }))

  const role = viewer ? normalizeRole(viewer.role) : 'director'
  if (!viewer || role === 'director') return [directors, ...teams]
  if (role === 'manager') return teams.filter((team) => team.lead?.id === viewer.id)
  return []
}

/** Director keeps the base subtitle. Managers and reps get their own sentence. */
export function subtitleKey(role: Role, section: string) {
  if (role === 'rep') return `${section}.subtitleRep`
  if (role === 'manager') return `${section}.subtitleManager`
  return `${section}.subtitle`
}
