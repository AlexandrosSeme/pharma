import { createContext } from 'react'
import type { LogoOnDark, LogoShape } from '@/shared/ui'

export type Branding = {
  companyName: string
  /** Logo as a data URL (cropped and scaled to a fixed height), or null for the default mark. */
  logo: string | null
  /** Detected at upload from the logo's proportions. */
  logoShape: LogoShape
  /** How the logo is drawn on the dark sidebar and top bar. */
  logoOnDark: LogoOnDark
  /** Detected at upload: light logos get a dark tile on white backgrounds. */
  logoDarkTileOnLight: boolean
}

export type BrandingContextValue = {
  branding: Branding
  saveBranding: (branding: Branding) => void
  resetBranding: () => void
}

export const defaultBranding: Branding = {
  companyName: '',
  logo: null,
  logoShape: 'emblem',
  logoOnDark: 'original',
  logoDarkTileOnLight: false,
}

export const BrandingContext = createContext<BrandingContextValue | null>(null)
