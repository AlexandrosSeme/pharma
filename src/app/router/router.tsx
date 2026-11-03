import { createBrowserRouter } from 'react-router'
import { Layout } from '@/app/layout/Layout'
import { LoginPage } from '@/features/auth'
import { BrandingPage } from '@/features/branding'
import { CustomersPage } from '@/features/customers'
import { DashboardPage } from '@/features/dashboard'
import { LeadsPage } from '@/features/leads'
import { OrdersPage } from '@/features/orders'
import { ProductsPage } from '@/features/products'
import { ReportsPage } from '@/features/reports'
import { VisitsPage } from '@/features/visits'
import { NotFoundPage } from './NotFoundPage'
import { RequireAuth } from './RequireAuth'
import { MedicationPage } from '@/features/regulatory'

export const router = createBrowserRouter([
  { path: '/login', Component: LoginPage },
  {
    Component: RequireAuth,
    children: [
      {
        path: '/',
        Component: Layout,
        children: [
          { index: true, Component: DashboardPage },
          {
            path: 'calendar',
            lazy: () => import('@/features/calendar').then((m) => ({ Component: m.CalendarPage })),
          },
          { path: 'products', Component: ProductsPage },
          { path: 'orders', Component: OrdersPage },
          { path: 'customers', Component: CustomersPage },
          { path: 'map', lazy: () => import('@/features/map').then((m) => ({ Component: m.MapPage })) },
          { path: 'leads', Component: LeadsPage },
          { path: 'visits', Component: VisitsPage },
          { path: 'reports', Component: ReportsPage },
          { path: 'settings/branding', Component: BrandingPage },
          { path: 'medication/:productId?', Component: MedicationPage },
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
])
