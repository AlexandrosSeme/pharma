import { useState, type ReactNode } from 'react'
import { memberByEmail, memberById } from '@/features/team/roster'
import type { TeamMember } from '@/features/team/types'
import { AuthContext, type User } from './AuthContext'

const STORAGE_KEY = 'pharmasales.user'

function toUser(member: TeamMember): User {
  return { id: member.id, name: member.name, email: member.email, role: member.role }
}

function loadUser(): User | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as User
    const known = memberById(parsed.id)
    return known ? toUser(known) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser)

  async function login(email: string, password: string) {
    // TODO: replace with a real API call, e.g. POST /api/auth/login
    if (!email || !password) throw new Error('required')
    const member = memberByEmail(email)
    if (!member) throw new Error('unknown-user')
    const loggedIn = toUser(member)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedIn))
    setUser(loggedIn)
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return <AuthContext value={{ user, login, logout }}>{children}</AuthContext>
}