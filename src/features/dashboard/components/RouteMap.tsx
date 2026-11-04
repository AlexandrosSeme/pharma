import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_MAP_ID,
  loadGoogleMaps,
  onGoogleMapsAuthFailure,
} from '@/features/map/lib/googleMaps'
import type { ActivityType } from '@/features/calendar'
import type { RouteStop } from '../hooks/useRepHome'
import styles from './RouteMap.module.css'

const ATHENS = { lat: 37.98, lng: 23.73 }
const pinKinds: ActivityType[] = ['visit', 'call', 'meeting', 'task']

type RouteMapProps = {
  stops: RouteStop[]
  isLoading: boolean
}

function signatureOf(stops: RouteStop[]) {
  return stops
    .map((stop) => `${stop.id}:${stop.order}:${stop.latitude}:${stop.longitude}:${stop.kind}:${stop.done ? 1 : 0}`)
    .join('|')
}

function distanceToSegment(point: google.maps.LatLngLiteral, from: google.maps.LatLngLiteral, to: google.maps.LatLngLiteral) {
  const dx = to.lng - from.lng
  const dy = to.lat - from.lat
  const len2 = dx * dx + dy * dy || 1
  const t = Math.min(1, Math.max(0, ((point.lng - from.lng) * dx + (point.lat - from.lat) * dy) / len2))
  return Math.hypot(from.lng + t * dx - point.lng, from.lat + t * dy - point.lat)
}

/** A finished leg that runs back over a road still ahead needs to sit beside it. */
function doublesBack(from: google.maps.LatLngLiteral, to: google.maps.LatLngLiteral, path: google.maps.LatLngLiteral[], index: number) {
  for (let next = index + 1; next < path.length - 1; next += 1) {
    const mid = {
      lat: (path[next].lat + path[next + 1].lat) / 2,
      lng: (path[next].lng + path[next + 1].lng) / 2,
    }
    if (distanceToSegment(mid, from, to) < 0.012) return true
  }
  return false
}

/** Pull a finished leg off the road still ahead, so the gray line stays visible when the route doubles back. */
function bow(from: google.maps.LatLngLiteral, to: google.maps.LatLngLiteral): google.maps.LatLngLiteral[] {
  const dx = to.lng - from.lng
  const dy = to.lat - from.lat
  const len = Math.hypot(dx, dy) || 1
  const shift = Math.min(0.015, len * 0.22)
  return [
    from,
    { lat: (from.lat + to.lat) / 2 + (dx / len) * shift, lng: (from.lng + to.lng) / 2 + (-dy / len) * shift },
    to,
  ]
}

/** Same address twice would stack the numbers, so later stops step aside. */
function place(stops: RouteStop[]) {
  const seen = new Map<string, number>()
  return stops.map((stop) => {
    const key = `${stop.latitude.toFixed(5)},${stop.longitude.toFixed(5)}`
    const n = seen.get(key) ?? 0
    seen.set(key, n + 1)
    if (n === 0) return stop
    return {
      ...stop,
      latitude: stop.latitude + 0.004 * n,
      longitude: stop.longitude + 0.004 * n,
    }
  })
}

export function RouteMap({ stops, isLoading }: RouteMapProps) {
  const { t, i18n } = useTranslation()
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(GOOGLE_MAPS_API_KEY ? 'loading' : 'error')
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const linesRef = useRef<google.maps.Polyline[]>([])
  const stopsRef = useRef(stops)
  const signature = signatureOf(stops)
  stopsRef.current = stops
  const hasKey = !!GOOGLE_MAPS_API_KEY
  const language = i18n.resolvedLanguage ?? 'en'
  const hasDone = stops.some((stop) => stop.done)

  useEffect(() => {
    if (!hasKey) return
    let cancelled = false
    const unsubscribe = onGoogleMapsAuthFailure(() => setStatus('error'))

    loadGoogleMaps(language)
      .then(() => {
        if (cancelled || !containerRef.current) return
        mapRef.current = new google.maps.Map(containerRef.current, {
          mapId: GOOGLE_MAPS_MAP_ID,
          center: ATHENS,
          zoom: 11,
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
        })
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      unsubscribe()
      markersRef.current.forEach((marker) => {
        marker.map = null
      })
      markersRef.current = []
      linesRef.current.forEach((line) => line.setMap(null))
      linesRef.current = []
      if (mapRef.current) google.maps.event.clearInstanceListeners(mapRef.current)
      mapRef.current = null
    }
  }, [hasKey, language])

  useEffect(() => {
    const map = mapRef.current
    if (status !== 'ready' || !map) return

    markersRef.current.forEach((marker) => {
      marker.map = null
    })
    markersRef.current = []
    linesRef.current.forEach((line) => line.setMap(null))
    linesRef.current = []

    const placed = place(stopsRef.current)
    if (!placed.length) return

    const rootStyle = getComputedStyle(document.documentElement)
    const stroke = rootStyle.getPropertyValue('--bs-primary').trim() || '#1d4ed8'
    const doneStroke = '#64748b'
    const bounds = new google.maps.LatLngBounds()
    const path: google.maps.LatLngLiteral[] = []

    for (const stop of placed) {
      const position = { lat: stop.latitude, lng: stop.longitude }
      bounds.extend(position)
      path.push(position)
      const content = document.createElement('div')
      content.className = [styles.pin, styles[stop.kind], stop.done ? styles.done : ''].filter(Boolean).join(' ')
      content.textContent = String(stop.order)
      markersRef.current.push(
        new google.maps.marker.AdvancedMarkerElement({
          map,
          position,
          content,
          title: `${stop.order}. ${stop.name}`,
          zIndex: 100 + stop.order,
        }),
      )
    }

    for (let index = 0; index < path.length - 1; index += 1) {
      // The leg that arrives at a finished stop is behind the rep, so it steps back with the pin.
      const covered = placed[index + 1].done
      const from = path[index]
      const to = path[index + 1]
      const leg = covered && doublesBack(from, to, path, index) ? bow(from, to) : [from, to]
      leg.forEach((point) => bounds.extend(point))
      linesRef.current.push(
        new google.maps.Polyline({
          map,
          path: leg,
          strokeColor: covered ? doneStroke : stroke,
          strokeOpacity: 1,
          strokeWeight: covered ? 5 : 4,
          geodesic: false,
          zIndex: covered ? 2 : 1,
        }),
      )
    }

    if (placed.length === 1) {
      map.setCenter(bounds.getCenter())
      map.setZoom(14)
      return
    }
    map.fitBounds(bounds, 64)
  }, [status, signature])

  return (
    <div>
      <div className={styles.frame}>
        <div ref={containerRef} className={styles.map} role="img" aria-label={t('dashboard.mapTitle')} />
        {(isLoading || (hasKey && status === 'loading')) && (
          <p className={styles.message}>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
            {t('common.loading')}
          </p>
        )}
        {!isLoading && status === 'error' && <p className={styles.message}>{t('dashboard.mapMissing')}</p>}
        {!isLoading && status === 'ready' && stops.length === 0 && <p className={styles.message}>{t('dashboard.mapEmpty')}</p>}
        {status === 'ready' && stops.length > 0 && (
          <p className={styles.legend}>
            {pinKinds.map(
              (kind) =>
                stops.some((stop) => stop.kind === kind && !stop.done) && (
                  <span key={kind}>
                    <i className={`${styles.swatch} ${styles[kind]}`} /> {t(`calendar.types.${kind}`)}
                  </span>
                ),
            )}
            {hasDone && (
              <span>
                <i className={`${styles.swatch} ${styles.done}`} /> {t('dashboard.mapDone')}
              </span>
            )}
          </p>
        )}
      </div>
      {status === 'ready' && stops.length > 0 && <p className={styles.hint}>{t('dashboard.mapHint')}</p>}
    </div>
  )
}
