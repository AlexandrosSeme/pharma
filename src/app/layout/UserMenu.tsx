import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth'
import { Avatar } from '@/shared/ui'
import { LanguageSwitch } from './LanguageSwitch'

export function UserMenu() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!user) return null

  return (
    <div ref={ref} className="dropdown">
      <button
        type="button"
        className="btn btn-sm btn-link text-body text-decoration-none d-flex align-items-center gap-2 p-1"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('nav.userMenu')}
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar name={user.name} />
        <span className="d-none d-md-block text-start lh-sm">
          <span className="d-block small fw-semibold text-body-emphasis">{user.name}</span>
          <span className="d-block small text-body-secondary">{t(`roles.${user.role}`)}</span>
        </span>
        <i className="bi bi-chevron-down small text-body-secondary" aria-hidden="true" />
      </button>

      <div
        className={`dropdown-menu dropdown-menu-end shadow-sm${open ? ' show' : ''}`}
        data-bs-popper="static"
        data-bs-theme="light"
        role="menu"
      >
        <div className="px-3 py-2">
          <div className="small fw-semibold text-body-emphasis">{user.name}</div>
          <div className="small text-body-secondary">{user.email}</div>
        </div>
        <div className="d-sm-none px-3 pb-2">
          <LanguageSwitch />
        </div>
        <hr className="dropdown-divider" />
        <Link
          to="/settings/branding"
          role="menuitem"
          className="dropdown-item d-flex align-items-center gap-2"
          onClick={() => setOpen(false)}
        >
          <i className="bi bi-image" aria-hidden="true" />
          {t('nav.branding')}
        </Link>
        <hr className="dropdown-divider" />
        <button
          type="button"
          role="menuitem"
          className="dropdown-item d-flex align-items-center gap-2"
          onClick={() => {
            setOpen(false)
            logout()
          }}
        >
          <i className="bi bi-box-arrow-right" aria-hidden="true" />
          {t('auth.logout')}
        </button>
      </div>
    </div>
  )
}
