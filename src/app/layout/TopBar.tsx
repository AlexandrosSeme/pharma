import { useTranslation } from 'react-i18next'
import { useFormatters } from '@/shared/hooks/useFormatters'
import { BrandLogo } from '@/features/branding'
import { LanguageSwitch } from './LanguageSwitch'
import styles from './TopBar.module.css'
import { UserMenu } from './UserMenu'

type TopBarProps = {
  menuOpen: boolean
  onMenuClick: () => void
}

export function TopBar({ menuOpen, onMenuClick }: TopBarProps) {
  const { t } = useTranslation()
  const { formatLongDate } = useFormatters()

  return (
    <header
      data-bs-theme="dark"
      className={`${styles.topbar} sticky-top d-flex align-items-center gap-2 px-3 px-md-4`}
    >
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary d-lg-none"
        aria-controls="app-sidebar"
        aria-expanded={menuOpen}
        aria-label={t('nav.openMenu')}
        onClick={onMenuClick}
      >
        <i className="bi bi-list fs-5 lh-1" aria-hidden="true" />
      </button>
      <span className="d-lg-none">
        <BrandLogo />
      </span>

      <div className="d-none d-lg-flex align-items-center gap-2 small text-body-secondary">
        <i className="bi bi-calendar3" aria-hidden="true" />
        {formatLongDate(new Date())}
      </div>

      <div className="ms-auto d-flex align-items-center gap-2 gap-md-3">
        <span className="d-none d-sm-inline-flex">
          <LanguageSwitch />
        </span>
        <UserMenu />
      </div>
    </header>
  )
}
