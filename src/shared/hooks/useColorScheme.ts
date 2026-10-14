import { useSyncExternalStore } from 'react'

export type ColorScheme = 'light' | 'dark'

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] })
  return () => observer.disconnect()
}

function getSnapshot(): ColorScheme {
  return document.documentElement.dataset.bsTheme === 'dark' ? 'dark' : 'light'
}

export function useColorScheme() {
  return useSyncExternalStore(subscribe, getSnapshot)
}
