import { createContext } from 'react'
import type { WatchFocus } from './scope'

export type WatchContextValue = {
  focus: WatchFocus | null
  setFocus: (focus: WatchFocus | null) => void
}

export const WatchContext = createContext<WatchContextValue | null>(null)

export type { WatchFocus }
