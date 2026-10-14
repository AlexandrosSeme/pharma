import { Logo } from '@/shared/ui'
import { useBranding } from '../useBranding'

type BrandLogoProps = {
  size?: 'md' | 'lg'
  compact?: boolean
}

/** The app logo, using the company's uploaded logo and name when set. */
export function BrandLogo(props: BrandLogoProps) {
  const { branding } = useBranding()
  return (
    <Logo
      {...props}
      src={branding.logo}
      shape={branding.logoShape}
      name={branding.companyName}
      onDark={branding.logoOnDark}
      darkTileOnLight={branding.logoDarkTileOnLight}
    />
  )
}
