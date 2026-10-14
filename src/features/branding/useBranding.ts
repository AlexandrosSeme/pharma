import { useContext } from 'react'
import { BrandingContext } from './BrandingContext'

export function useBranding() {
  const ctx = useContext(BrandingContext)
  if (!ctx) throw new Error('useBranding must be used inside <BrandingProvider>')
  return ctx
}
