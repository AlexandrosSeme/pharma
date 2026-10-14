export type NavItem = {
  path: string
  labelKey: string
  icon: string
}

export const navItems: NavItem[] = [
  { path: '/', labelKey: 'nav.dashboard', icon: 'bi-speedometer2' },
  { path: '/products', labelKey: 'nav.products', icon: 'bi-capsule' },
  { path: '/orders', labelKey: 'nav.orders', icon: 'bi-receipt' },
  { path: '/customers', labelKey: 'nav.customers', icon: 'bi-building' },
  { path: '/map', labelKey: 'nav.map', icon: 'bi-map' },
  { path: '/leads', labelKey: 'nav.leads', icon: 'bi-funnel' },
  { path: '/visits', labelKey: 'nav.visits', icon: 'bi-geo-alt' },
  { path: '/reports', labelKey: 'nav.reports', icon: 'bi-bar-chart-line' },
]
