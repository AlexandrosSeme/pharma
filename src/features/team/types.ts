export const roles = ['director', 'manager', 'rep'] as const
export type Role = (typeof roles)[number]

export type Territory = { en: string; el: string }

export type TeamMember = {
  id: string
  name: string
  email: string
  role: Role
  /** The manager this person reports to. The director has none. */
  managerId?: string
  territory: Territory
}
