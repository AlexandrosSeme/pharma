import { useCustomers } from '@/features/customers'
import { useLeads } from '@/features/leads'
import { useOrders } from '@/features/orders'
import { useProducts } from '@/features/products'

const LOW_STOCK_THRESHOLD = 100

export function useDashboardStats() {
  const orders = useOrders()
  const customers = useCustomers()
  const leads = useLeads()
  const products = useProducts()

  const validOrders = orders.data?.filter((o) => o.status !== 'cancelled') ?? []
  const openLeads = leads.data?.filter((l) => l.status !== 'lost') ?? []

  return {
    isLoading: orders.isLoading || customers.isLoading || leads.isLoading || products.isLoading,
    error: orders.error ?? customers.error ?? leads.error ?? products.error,
    revenue: validOrders.reduce((sum, o) => sum + o.total, 0),
    orderCount: validOrders.length,
    activeCustomers: customers.data?.filter((c) => c.status === 'active').length ?? 0,
    openLeads: openLeads.length,
    pipelineValue: openLeads.reduce((sum, l) => sum + l.estimatedValue, 0),
    lowStockProducts:
      products.data?.filter((p) => p.active && p.stock < LOW_STOCK_THRESHOLD).length ?? 0,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
  }
}
