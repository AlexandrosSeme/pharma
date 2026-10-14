import { useEffect, useState } from 'react'
import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import styles from './Layout.module.css'

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return (
    <div className={styles.layout}>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className={styles.main}>
        <TopBar menuOpen={menuOpen} onMenuClick={() => setMenuOpen(true)} />
        <main className="p-3 p-md-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
