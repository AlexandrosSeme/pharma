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
import { NotFoundPage } from './NotFoundPage'
import { RequireAuth } from './RequireAuth'

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
          { path: 'products', Component: ProductsPage },
          { path: 'orders', Component: OrdersPage },
          { path: 'customers', Component: CustomersPage },
          { path: 'leads', Component: LeadsPage },
          { path: 'reports', Component: ReportsPage },
          { path: 'settings/branding', Component: BrandingPage },
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
])
