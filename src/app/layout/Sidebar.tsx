import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { navItems } from './navItems'
import { BrandLogo } from '@/features/branding'
import styles from './Sidebar.module.css'

type SidebarProps = {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation()

  return (
    <>
      <aside
        id="app-sidebar"
        data-bs-theme="dark"
        className={`offcanvas-lg offcanvas-start ${styles.sidebar}${open ? ' show' : ''}`}
        tabIndex={-1}
        aria-labelledby="app-sidebar-title"
      >
        <div className={`offcanvas-header ${styles.brand}`}>
          <span id="app-sidebar-title" className="offcanvas-title">
            <BrandLogo />
          </span>
          <button type="button" className="btn-close" aria-label={t('nav.closeMenu')} onClick={onClose} />
        </div>
        <div className={`d-none d-lg-flex align-items-center px-3 ${styles.brand}`}>
          <BrandLogo />
        </div>
        <div className={`offcanvas-body d-flex flex-column p-3 ${styles.body}`}>
          <nav className="flex-grow-1 overflow-auto">
            <ul className="nav flex-column gap-1">
              {navItems.map((item) => (
                <li key={item.path} className="nav-item">
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={`nav-link ${styles.link}`}
                    onClick={onClose}
                  >
                    <i className={`bi ${item.icon} ${styles.linkIcon}`} aria-hidden="true" />
                    {t(item.labelKey)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className={`${styles.footer} small text-body-secondary px-3 pt-3`}>
            © {new Date().getFullYear()} PharmaSales
          </div>
        </div>
      </aside>
      {open && <div className="offcanvas-backdrop fade show d-lg-none" onClick={onClose} />}
    </>
  )
}
