import { createContext } from 'react'
import type { Role } from '@/features/team/types'

export type User = {
  id: string
  name: string
  email: string
  role: Role
}

export type AuthContextValue = {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)