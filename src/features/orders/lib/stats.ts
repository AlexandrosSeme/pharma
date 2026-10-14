import { toMonthKey } from '@/shared/lib/months'
import { orderStatuses, type Order, type OrderStatus } from '../types'

export const isRevenueOrder = (order: Order) => order.status !== 'cancelled'

export function ordersInMonths(orders: Order[], monthKeys: string[]) {
  const keys = new Set(monthKeys)
  return orders.filter((o) => keys.has(toMonthKey(o.orderDate)))
}

function sumByMonth(orders: Order[], monthKeys: string[], value: (o: Order) => number) {
  const totals: Record<string, number> = Object.fromEntries(monthKeys.map((k) => [k, 0]))
  for (const o of orders) {
    const key = toMonthKey(o.orderDate)
    if (isRevenueOrder(o) && key in totals) totals[key] += value(o)
  }
  return monthKeys.map((k) => Math.round(totals[k] * 100) / 100)
}

export const revenueByMonth = (orders: Order[], monthKeys: string[]) =>
  sumByMonth(orders, monthKeys, (o) => o.total)

export function countByStatus(orders: Order[]) {
  const counts = Object.fromEntries(orderStatuses.map((s) => [s, 0])) as Record<OrderStatus, number>
  for (const o of orders) counts[o.status] += 1
  return counts
}
