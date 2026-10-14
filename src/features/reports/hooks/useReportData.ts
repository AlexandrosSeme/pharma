import { useCustomers } from '@/features/customers'
import { useLeads } from '@/features/leads'
import { isRevenueOrder, ordersInMonths, revenueByMonth, useOrders } from '@/features/orders'
import { useProducts } from '@/features/products'
import { lastMonthKeys, toMonthKey, yearToDateMonthKeys } from '@/shared/lib/months'
import {
  leadsBySource,
  pipelineByStatus,
  revenueByCity,
  revenueByCustomerType,
  topProductsByRevenue,
} from '../lib/aggregations'

export const reportPeriods = ['last3', 'last6', 'ytd', 'last12'] as const
export type ReportPeriod = (typeof reportPeriods)[number]

const TOP_N = 8

function monthsFor(period: ReportPeriod) {
  switch (period) {
    case 'last3':
      return lastMonthKeys(3)
    case 'last6':
      return lastMonthKeys(6)
    case 'ytd':
      return yearToDateMonthKeys()
    case 'last12':
      return lastMonthKeys(12)
  }
}

export function useReportData(period: ReportPeriod) {
  const ordersQuery = useOrders()
  const customersQuery = useCustomers()
  const productsQuery = useProducts()
  const leadsQuery = useLeads()

  const months = monthsFor(period)
  const monthSet = new Set(months)
  const orders = ordersInMonths(ordersQuery.data ?? [], months)
  const customers = customersQuery.data ?? []
  const leads = (leadsQuery.data ?? []).filter((l) => monthSet.has(toMonthKey(l.createdAt)))

  const revenueOrders = orders.filter(isRevenueOrder)
  const revenue = revenueOrders.reduce((sum, o) => sum + o.total, 0)

  return {
    isLoading: ordersQuery.isLoading || customersQuery.isLoading || productsQuery.isLoading || leadsQuery.isLoading,
    error: ordersQuery.error ?? customersQuery.error ?? productsQuery.error ?? leadsQuery.error,
    months,
    kpis: {
      revenue,
      orderCount: revenueOrders.length,
      averageOrderValue: revenueOrders.length ? revenue / revenueOrders.length : 0,
      cancellationRate: orders.length ? (orders.length - revenueOrders.length) / orders.length : 0,
    },
    revenueByMonth: revenueByMonth(orders, months),
    topProducts: topProductsByRevenue(orders, productsQuery.data ?? [], TOP_N),
    topCities: revenueByCity(orders, customers, TOP_N),
    revenueByCustomerType: revenueByCustomerType(orders, customers),
    pipelineByStatus: pipelineByStatus(leads),
    leadsBySource: leadsBySource(leads),
    leadCount: leads.length,
  }
}
