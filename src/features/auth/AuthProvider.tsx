import { useState, type ReactNode } from 'react'
import { AuthContext, type User } from './AuthContext'

const STORAGE_KEY = 'pharmasales.user'

function loadUser(): User | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? (JSON.parse(raw) as User) : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser)

  async function login(email: string, password: string) {
    // TODO: replace with a real API call, e.g. POST /api/auth/login
    if (!email || !password) throw new Error('Email and password are required')
    const loggedIn: User = { id: '1', name: 'Demo User', email, role: 'manager' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedIn))
    setUser(loggedIn)
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return <AuthContext value={{ user, login, logout }}>{children}</AuthContext>
}