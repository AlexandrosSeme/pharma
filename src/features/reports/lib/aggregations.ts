import type { Customer, CustomerType } from '@/features/customers'
import { customerTypes } from '@/features/customers'
import type { Lead, LeadStatus } from '@/features/leads'
import { leadStatuses } from '@/features/leads'
import { isRevenueOrder, type Order } from '@/features/orders'
import type { Product } from '@/features/products'

export type Ranked = { label: string; value: number }

const round2 = (n: number) => Math.round(n * 100) / 100

function topN(totals: Map<string, number>, n: number): Ranked[] {
  return [...totals]
    .map(([label, value]) => ({ label, value: round2(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n)
}

export function topProductsByRevenue(orders: Order[], products: Product[], n: number) {
  const names = new Map(products.map((p) => [p.id, p.name]))
  const totals = new Map<string, number>()
  for (const o of orders.filter(isRevenueOrder)) {
    for (const item of o.items) {
      const name = names.get(item.productId) ?? item.productId
      totals.set(name, (totals.get(name) ?? 0) + item.quantity * item.unitPrice)
    }
  }
  return topN(totals, n)
}

export function revenueByCity(orders: Order[], customers: Customer[], n: number) {
  const cities = new Map(customers.map((c) => [c.id, c.city]))
  const totals = new Map<string, number>()
  for (const o of orders.filter(isRevenueOrder)) {
    const city = cities.get(o.customerId) ?? '—'
    totals.set(city, (totals.get(city) ?? 0) + o.total)
  }
  return topN(totals, n)
}

export function revenueByCustomerType(orders: Order[], customers: Customer[]) {
  const types = new Map(customers.map((c) => [c.id, c.type]))
  const totals = Object.fromEntries(customerTypes.map((t) => [t, 0])) as Record<CustomerType, number>
  for (const o of orders.filter(isRevenueOrder)) {
    const type = types.get(o.customerId)
    if (type) totals[type] += o.total
  }
  return customerTypes.map((t) => round2(totals[t]))
}

export function pipelineByStatus(leads: Lead[]) {
  const totals = Object.fromEntries(leadStatuses.map((s) => [s, 0])) as Record<LeadStatus, number>
  for (const l of leads) totals[l.status] += l.estimatedValue
  return leadStatuses.map((s) => totals[s])
}

export function leadsBySource(leads: Lead[]) {
  const totals = new Map<string, number>()
  for (const l of leads) totals.set(l.source, (totals.get(l.source) ?? 0) + 1)
  return topN(totals, totals.size)
}
