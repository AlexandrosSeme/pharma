import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GeoError, getCurrentPosition, type GeoErrorCode } from '@/shared/hooks/useGeolocation'
import { googleMaps } from '@/shared/lib/geo'

type State =
  | { status: 'idle' | 'locating' }
  | { status: 'blocked'; url: string }
  | { status: 'error'; error: GeoErrorCode }

/** Opens Google Maps at the device's current position. */
export function MyLocationButton() {
  const { t } = useTranslation()
  const [state, setState] = useState<State>({ status: 'idle' })

  async function open() {
    setState({ status: 'locating' })
    try {
      const url = googleMaps.place(await getCurrentPosition())
      // Opened after an async wait, so popup blockers (notably iOS Safari) may refuse; then offer a link to tap.
      // Not the 'noopener' feature: with it window.open always returns null and blocking can't be detected.
      const tab = window.open(url, '_blank')
      if (tab) tab.opener = null
      setState(tab ? { status: 'idle' } : { status: 'blocked', url })
    } catch (e) {
      setState({ status: 'error', error: e instanceof GeoError ? e.code : 'unavailable' })
    }
  }

  return (
    <div className="d-flex flex-column">
      {state.status === 'blocked' ? (
        <a
          className="btn btn-outline-primary text-nowrap"
          href={state.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setState({ status: 'idle' })}
        >
          <i className="bi bi-box-arrow-up-right me-2" aria-hidden="true" />
          {t('location.openMap')}
        </a>
      ) : (
        <button
          type="button"
          className="btn btn-outline-primary text-nowrap"
          disabled={state.status === 'locating'}
          onClick={open}
        >
          {state.status === 'locating' ? (
            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          ) : (
            <i className="bi bi-crosshair me-2" aria-hidden="true" />
          )}
          {state.status === 'locating' ? t('location.locating') : t('location.myLocation')}
        </button>
      )}
      <div aria-live="polite">
        {state.status === 'error' && (
          <p className="small text-danger mt-1 mb-0">{t(`location.errors.${state.error}`)}</p>
        )}
      </div>
    </div>
  )
}
