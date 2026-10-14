import { useEffect, useState } from 'react'
import type { Coordinates } from '@/shared/lib/geo'

export type GeoPosition = Coordinates & {
  /** Radius in meters within which the real position lies. */
  accuracy: number
}

export type GeoErrorCode = 'unsupported' | 'insecure' | 'denied' | 'unavailable' | 'timeout'

export class GeoError extends Error {
  readonly code: GeoErrorCode

  constructor(code: GeoErrorCode) {
    super(`Geolocation failed: ${code}`)
    this.name = 'GeoError'
    this.code = code
  }
}

export type GeoState =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'ready'; position: GeoPosition }
  | { status: 'error'; error: GeoErrorCode }

const options: PositionOptions = { enableHighAccuracy: true, timeout: 20_000, maximumAge: 30_000 }

/** Browsers only expose location on HTTPS or localhost. */
function unavailableReason(): GeoErrorCode | null {
  if (!window.isSecureContext) return 'insecure'
  if (!('geolocation' in navigator)) return 'unsupported'
  return null
}

const toPosition = ({ coords }: GeolocationPosition): GeoPosition => ({
  latitude: coords.latitude,
  longitude: coords.longitude,
  accuracy: coords.accuracy,
})

const toErrorCode = (error: GeolocationPositionError): GeoErrorCode =>
  error.code === error.PERMISSION_DENIED ? 'denied' : error.code === error.TIMEOUT ? 'timeout' : 'unavailable'

export function getCurrentPosition() {
  return new Promise<GeoPosition>((resolve, reject) => {
    const reason = unavailableReason()
    if (reason) return reject(new GeoError(reason))
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(toPosition(p)),
      (e) => reject(new GeoError(toErrorCode(e))),
      options,
    )
  })
}

/** Follows the device position while `enabled`, so lists stay current as the rep moves. */
export function useWatchPosition(enabled: boolean): GeoState {
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const [error, setError] = useState<GeoErrorCode | null>(null)
  const reason = unavailableReason()

  useEffect(() => {
    if (!enabled || reason) return
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setPosition(toPosition(p))
        setError(null)
      },
      (e) => setError(toErrorCode(e)),
      options,
    )
    return () => {
      navigator.geolocation.clearWatch(id)
      setError(null)
    }
  }, [enabled, reason])

  if (!enabled) return { status: 'idle' }
  if (reason) return { status: 'error', error: reason }
  if (position) return { status: 'ready', position }
  if (error) return { status: 'error', error }
  return { status: 'locating' }
}
