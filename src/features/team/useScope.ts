import { use } from 'react'
import { useAuth } from '@/features/auth/useAuth'
import { roster } from './roster'
import { normalizeRole, visibleMembers, watchRole, watchUserId, watchedMembers } from './scope'
import { WatchContext } from './watchContext'

export function useScope() {
  const { user } = useAuth()
  const watch = use(WatchContext)
  const role = normalizeRole(user?.role)
  const focus = watch?.focus ?? null
  const setFocus = watch?.setFocus ?? (() => {})
  const members = user ? visibleMembers(user.id, role) : []
  const watched = user ? watchedMembers(user.id, role, focus) : []
  const scopeRole = user ? watchRole(role, focus, watched) : role
  const scopeUserId = user ? watchUserId(user.id, focus) : ''
  return { user, role, members, focus, setFocus, watched, scopeRole, scopeUserId, roster }
}
