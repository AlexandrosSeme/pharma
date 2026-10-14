import { createContext } from 'react'

export type User = {
  id: string
  name: string
  email: string
  role: 'rep' | 'manager' | 'admin'
}

export type AuthContextValue = {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)