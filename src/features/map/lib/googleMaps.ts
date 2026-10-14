import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
export const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'

let configured = false
let authFailed = false
const authListeners = new Set<() => void>()

/** Google calls this global when the key is invalid, restricted or has no billing account. */
declare global {
  interface Window {
    gm_authFailure?: () => void
  }
}

window.gm_authFailure = () => {
  authFailed = true
  authListeners.forEach((listener) => listener())
}

export function onGoogleMapsAuthFailure(listener: () => void) {
  if (authFailed) listener()
  authListeners.add(listener)
  return () => {
    authListeners.delete(listener)
  }
}

/** The script loads once per page, so the map keeps the language active when it first loaded. */
export async function loadGoogleMaps(language: string) {
  if (!configured) {
    setOptions({ key: GOOGLE_MAPS_API_KEY!, v: 'weekly', language, region: 'GR' })
    configured = true
  }
  await Promise.all([importLibrary('maps'), importLibrary('marker')])
}
