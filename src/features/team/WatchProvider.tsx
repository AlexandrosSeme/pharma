import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/features/auth/useAuth'
import { WatchContext, type WatchFocus } from './watchContext'

export function WatchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [focus, setFocus] = useState<WatchFocus | null>(null)

  useEffect(() => {
    setFocus(null)
  }, [user?.id])

  return <WatchContext value={{ focus, setFocus }}>{children}</WatchContext>
}
