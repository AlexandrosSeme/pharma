import { useEffect, useState, type ReactNode } from 'react'
import { BrandingContext, defaultBranding, type Branding } from './BrandingContext'
import { normalizeLogo } from './lib/readLogoFile'

const STORAGE_KEY = 'pharmasales.branding'
/** Bump when logo processing changes, so stored logos are re-analysed once. */
const LOGO_VERSION = 4

type StoredBranding = Partial<Branding> & { logoVersion?: number }

function loadStored(): StoredBranding | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? (JSON.parse(raw) as StoredBranding) : null
}

function toBranding(stored: StoredBranding | null): Branding {
  return { ...defaultBranding, ...stored }
}

function persist(branding: Branding) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...branding, logoVersion: LOGO_VERSION }))
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  // TODO: replace localStorage with a real API (e.g. GET/PUT /api/company/branding)
  const [branding, setBranding] = useState<Branding>(() => toBranding(loadStored()))

  useEffect(() => {
    const stored = loadStored()
    if (!stored?.logo || stored.logoVersion === LOGO_VERSION) return
    let cancelled = false
    normalizeLogo(stored.logo)
      .then(({ dataUrl, shape, onDark, needsDarkTileOnLight }) => {
        if (cancelled) return
        const next: Branding = {
          ...toBranding(stored),
          logo: dataUrl,
          logoShape: shape,
          logoOnDark: onDark,
          logoDarkTileOnLight: needsDarkTileOnLight,
        }
        persist(next)
        setBranding(next)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  function saveBranding(next: Branding) {
    persist(next)
    setBranding(next)
  }

  function resetBranding() {
    localStorage.removeItem(STORAGE_KEY)
    setBranding(defaultBranding)
  }

  return <BrandingContext value={{ branding, saveBranding, resetBranding }}>{children}</BrandingContext>
}
