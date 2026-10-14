import { MarkerClusterer, type Renderer } from '@googlemaps/markerclusterer'
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Customer } from '@/features/customers'
import type { GeoState } from '@/shared/hooks/useGeolocation'
import type { Coordinates } from '@/shared/lib/geo'
import { customerTypeStyle } from '../lib/customerTypeStyle'
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_MAP_ID,
  loadGoogleMaps,
  onGoogleMapsAuthFailure,
} from '../lib/googleMaps'
import styles from './CustomerMap.module.css'

export type MappedCustomer = Customer & Coordinates

type CustomerMapProps = {
  customers: MappedCustomer[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  geo: GeoState
  onLocate: () => void
  /** Rendered over the bottom of the map, e.g. the selected customer's card. */
  overlay?: ReactNode
}

type MarkerEntry = {
  marker: google.maps.marker.AdvancedMarkerElement
  content: HTMLElement
  customer: MappedCustomer
}

const GREECE = { lat: 38.6, lng: 23.6 }
const FOCUS_ZOOM = 15

const toLatLng = (c: Coordinates): google.maps.LatLngLiteral => ({ lat: c.latitude, lng: c.longitude })

function markerClassName(customer: Customer, selected: boolean) {
  return [
    styles.marker,
    styles[customerTypeStyle[customer.type].className],
    customer.status === 'inactive' && styles.inactive,
    selected && styles.selected,
  ]
    .filter(Boolean)
    .join(' ')
}

function pinContent(customer: Customer, selected: boolean) {
  const content = document.createElement('div')
  content.className = markerClassName(customer, selected)
  content.innerHTML = `<span class="${styles.pin}"><i class="bi ${customerTypeStyle[customer.type].icon}" aria-hidden="true"></i></span>`
  return content
}

export function CustomerMap({ customers, selectedId, onSelect, geo, onLocate, overlay }: CustomerMapProps) {
  const { t, i18n } = useTranslation()
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const frameRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const markersRef = useRef(new Map<string, MarkerEntry>())
  const selectedRef = useRef<string | null>(null)
  const meRef = useRef<{ dot: google.maps.marker.AdvancedMarkerElement; accuracy: google.maps.Circle } | null>(null)
  const centerOnNextFix = useRef(false)
  const hasKey = !!GOOGLE_MAPS_API_KEY
  const language = i18n.resolvedLanguage ?? 'en'
  const ready = status === 'ready'
  const position = geo.status === 'ready' ? geo.position : null

  const select = useEffectEvent((id: string | null) => onSelect(id))
  const clusterTitle = useEffectEvent((count: number) => t('map.cluster', { count }))

  useEffect(() => {
    if (!hasKey) return
    let cancelled = false
    const markers = markersRef.current
    const unsubscribe = onGoogleMapsAuthFailure(() => setStatus('error'))

    const renderer: Renderer = {
      render: ({ count, position }) => {
        const size = count < 10 ? 36 : count < 25 ? 42 : 48
        const content = document.createElement('span')
        content.className = styles.cluster
        content.style.width = content.style.height = `${size}px`
        content.textContent = String(count)
        return new google.maps.marker.AdvancedMarkerElement({
          position,
          content,
          title: clusterTitle(count),
          zIndex: 1000 + count,
        })
      },
    }

    loadGoogleMaps(language)
      .then(() => {
        if (cancelled) return
        const map = new google.maps.Map(containerRef.current!, {
          mapId: GOOGLE_MAPS_MAP_ID,
          center: GREECE,
          zoom: 6,
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
        })
        map.addListener('click', () => select(null))
        mapRef.current = map
        clustererRef.current = new MarkerClusterer({ map, renderer })
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      unsubscribe()
      clustererRef.current?.setMap(null)
      meRef.current?.accuracy.setMap(null)
      if (mapRef.current) google.maps.event.clearInstanceListeners(mapRef.current)
      clustererRef.current = null
      mapRef.current = null
      meRef.current = null
      markers.clear()
    }
  }, [hasKey, language])

  function fitAll() {
    const map = mapRef.current
    if (!map || !markersRef.current.size) return
    const bounds = new google.maps.LatLngBounds()
    markersRef.current.forEach(({ customer }) => bounds.extend(toLatLng(customer)))
    map.fitBounds(bounds, 48)
    google.maps.event.addListenerOnce(map, 'idle', () => {
      if ((map.getZoom() ?? 0) > FOCUS_ZOOM) map.setZoom(FOCUS_ZOOM)
    })
  }

  const syncMarkers = useEffectEvent(() => {
    const clusterer = clustererRef.current!
    clusterer.clearMarkers()
    markersRef.current.clear()
    for (const customer of customers) {
      const selected = customer.id === selectedId
      const content = pinContent(customer, selected)
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: toLatLng(customer),
        content,
        title: customer.name,
        gmpClickable: true,
        zIndex: selected ? 1000 : null,
      })
      marker.addEventListener('gmp-click', () => select(customer.id))
      markersRef.current.set(customer.id, { marker, content, customer })
    }
    clusterer.addMarkers([...markersRef.current.values()].map((m) => m.marker))
    selectedRef.current = selectedId
    fitAll()
  })

  const visibleKey = customers.map((c) => c.id).join()
  useEffect(() => {
    if (ready) syncMarkers()
  }, [ready, visibleKey])

  const syncSelection = useEffectEvent(() => {
    const previous = selectedRef.current && markersRef.current.get(selectedRef.current)
    if (previous) {
      previous.content.className = markerClassName(previous.customer, false)
      previous.marker.zIndex = null
    }
    selectedRef.current = selectedId

    const current = selectedId && markersRef.current.get(selectedId)
    const map = mapRef.current
    if (!current || !map) return
    current.content.className = markerClassName(current.customer, true)
    current.marker.zIndex = 1000
    if ((map.getZoom() ?? 0) < 14) map.setZoom(FOCUS_ZOOM)
    map.panTo(toLatLng(current.customer))
    const offset = Math.round((overlayRef.current?.offsetHeight ?? 0) / 2)
    if (offset) google.maps.event.addListenerOnce(map, 'idle', () => map.panBy(0, offset))
  })

  useEffect(() => {
    if (ready) syncSelection()
  }, [ready, selectedId])

  const syncPosition = useEffectEvent(() => {
    const map = mapRef.current!
    if (!position) {
      if (meRef.current) {
        meRef.current.dot.map = null
        meRef.current.accuracy.setMap(null)
        meRef.current = null
      }
      return
    }
    const center = toLatLng(position)
    if (meRef.current) {
      meRef.current.dot.position = center
      meRef.current.accuracy.setCenter(center)
      meRef.current.accuracy.setRadius(position.accuracy)
    } else {
      const color = getComputedStyle(frameRef.current!).getPropertyValue('--bs-primary').trim()
      const dot = document.createElement('span')
      dot.className = styles.me
      meRef.current = {
        dot: new google.maps.marker.AdvancedMarkerElement({ map, position: center, content: dot, zIndex: 2000 }),
        accuracy: new google.maps.Circle({
          map,
          center,
          radius: position.accuracy,
          clickable: false,
          fillColor: color,
          fillOpacity: 0.08,
          strokeColor: color,
          strokeOpacity: 0.35,
          strokeWeight: 1,
        }),
      }
    }
    if (centerOnNextFix.current) {
      centerOnNextFix.current = false
      focusOn(center)
    }
  })

  useEffect(() => {
    if (ready) syncPosition()
  }, [ready, position?.latitude, position?.longitude, position?.accuracy])

  function focusOn(center: google.maps.LatLngLiteral) {
    const map = mapRef.current
    if (!map) return
    if ((map.getZoom() ?? 0) < 14) map.setZoom(14)
    map.panTo(center)
  }

  function locate() {
    if (position) return focusOn(toLatLng(position))
    centerOnNextFix.current = true
    onLocate()
  }

  function zoomBy(delta: number) {
    const map = mapRef.current
    if (map) map.setZoom((map.getZoom() ?? 6) + delta)
  }

  return (
    <div ref={frameRef} className={styles.frame}>
      <div ref={containerRef} className={styles.map} role="region" aria-label={t('map.mapLabel')} />

      {!ready && (
        <div className={styles.state}>
          {!hasKey || status === 'error' ? (
            <div className="text-center text-body-secondary" role="alert">
              <i className="bi bi-map fs-2 d-block mb-2" aria-hidden="true" />
              <p className="fw-semibold text-body-emphasis mb-1">{t('map.unavailable')}</p>
              <p className="small mb-0">{t(hasKey ? 'map.loadFailed' : 'map.missingKey')}</p>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2 text-body-secondary">
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              {t('common.loading')}
            </div>
          )}
        </div>
      )}

      {ready && (
        <div className={styles.controls}>
          <div className={styles.zoomGroup}>
            <button
              type="button"
              className={`btn ${styles.control}`}
              title={t('map.zoomIn')}
              aria-label={t('map.zoomIn')}
              onClick={() => zoomBy(1)}
            >
              <i className="bi bi-plus-lg" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`btn ${styles.control}`}
              title={t('map.zoomOut')}
              aria-label={t('map.zoomOut')}
              onClick={() => zoomBy(-1)}
            >
              <i className="bi bi-dash-lg" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            className={`btn ${styles.control}${position ? ' active' : ''}`}
            title={t('map.locate')}
            aria-label={t('map.locate')}
            aria-pressed={!!position}
            onClick={locate}
          >
            {geo.status === 'locating' ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <i className="bi bi-crosshair" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className={`btn ${styles.control}`}
            title={t('map.fitAll')}
            aria-label={t('map.fitAll')}
            onClick={fitAll}
          >
            <i className="bi bi-arrows-fullscreen" aria-hidden="true" />
          </button>
        </div>
      )}

      {geo.status === 'error' && (
        <div className={`alert alert-warning small py-2 px-3 mb-0 ${styles.notice}`} role="alert">
          {t(`location.errors.${geo.error}`)}
        </div>
      )}

      <div ref={overlayRef} className={styles.overlay}>
        {ready && overlay}
      </div>
    </div>
  )
}
