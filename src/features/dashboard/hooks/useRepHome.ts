import { canSeeCustomer, useScope } from '@/features/team'
import { useActivities } from '@/features/calendar'
import { useClmDecks, useClmSessions } from '@/features/clm/queries'
import { daysUntil, isExpired, isExpiring } from '@/features/clm/lib/text'
import { EXPIRING_WITHIN_DAYS } from '@/features/clm/types'
import { useCustomers } from '@/features/customers'
import { useLeads } from '@/features/leads'
import type { LeadStatus } from '@/features/leads'
import { isRevenueOrder, useOrders } from '@/features/orders'
import type { OrderStatus } from '@/features/orders'
import { activityTypes, type Activity, type ActivityType } from '@/features/calendar'
import { lastMonthKeys, toMonthKey } from '@/shared/lib/months'

const ORDER_MONTHS = 6

export type RouteStop = {
  id: string
  customerId: string
  order: number
  name: string
  kind: ActivityType
  /** A visit to this customer is already done, so the pin steps back. */
  done: boolean
  latitude: number
  longitude: number
}

export type WeekLoad = {
  /** `YYYY-MM-DD` in local time, so the label stays on the calendar day. */
  date: string
  counts: Record<ActivityType, number>
}

export type HomeOrder = {
  id: string
  orderNumber: string
  customerName: string
  status: OrderStatus
  orderDate: string
}

const WEEKENDS_KEY = 'pharmasales.calendar.weekends'

const leadRank: Record<LeadStatus, number> = {
  proposal: 4,
  qualified: 3,
  contacted: 2,
  new: 1,
  lost: 0,
}

const openStatus: ReadonlySet<OrderStatus> = new Set(['pending', 'processing', 'shipped'])

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function useRepHome() {
  const { user, focus, watched, scopeUserId, scopeRole } = useScope()
  const activities = useActivities()
  const customers = useCustomers()
  const orders = useOrders()
  const leads = useLeads()
  const decks = useClmDecks()
  const sessions = useClmSessions()

  const now = new Date()
  const todayStart = startOfDay(now)
  const tomorrow = new Date(todayStart)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const customerById = new Map(
    (customers.data ?? [])
      .filter((customer) => scopeUserId && canSeeCustomer(customer, scopeUserId, scopeRole))
      .map((customer) => [customer.id, customer]),
  )
  const subjects = focus ? watched : user ? [{ id: user.id, name: user.name }] : []
  const subjectIds = new Set(subjects.map((person) => person.id))
  const subjectNames = new Set(subjects.map((person) => person.name))
  const mine = (activities.data ?? []).filter(
    (activity) => subjectIds.has(activity.repId) || subjectNames.has(activity.repName),
  )
  const inRange = (activity: Activity, from: Date, to: Date) => {
    const start = new Date(activity.start)
    return start >= from && start < to
  }

  const today = mine
    .filter((activity) => activity.status !== 'cancelled' && inRange(activity, todayStart, tomorrow))
    .sort((a, b) => a.start.localeCompare(b.start))
  const todayDone = today.filter((activity) => activity.status === 'done').length

  const visitedToday = new Set(
    today
      .filter((activity) => activity.type === 'visit' && activity.status === 'done' && activity.customerId)
      .map((activity) => activity.customerId as string),
  )
  const stops: RouteStop[] = []
  for (const activity of today) {
    if (!activity.customerId) continue
    const customer = customerById.get(activity.customerId)
    if (customer?.latitude == null || customer.longitude == null) continue
    stops.push({
      id: activity.id,
      customerId: activity.customerId,
      order: stops.length + 1,
      name: customer.name,
      kind: activity.type,
      done: activity.type === 'visit' && visitedToday.has(activity.customerId),
      latitude: customer.latitude,
      longitude: customer.longitude,
    })
  }

  const weekStart = startOfDay(now)
  const mondayOffset = (weekStart.getDay() + 6) % 7
  weekStart.setDate(weekStart.getDate() - mondayOffset)
  // The calendar week starts Monday and hides the weekend unless the rep turns it on.
  const showWeekends = localStorage.getItem(WEEKENDS_KEY) === 'true'
  const weekBars: WeekLoad[] = Array.from({ length: showWeekends ? 7 : 5 }, (_, index) => {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + index)
    const next = new Date(day)
    next.setDate(day.getDate() + 1)
    const items = mine.filter((activity) => activity.status !== 'cancelled' && inRange(activity, day, next))
    const pad = (n: number) => String(n).padStart(2, '0')
    return {
      date: `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`,
      counts: Object.fromEntries(activityTypes.map((type) => [type, items.filter((activity) => activity.type === type).length])) as Record<ActivityType, number>,
    }
  })
  const weekCount = weekBars.reduce(
    (sum, day) => sum + activityTypes.reduce((inner, type) => inner + day.counts[type], 0),
    0,
  )

  const book = new Set(mine.flatMap((activity) => (activity.customerId ? [activity.customerId] : [])))
  const bookOrders = (orders.data ?? []).filter((order) => book.has(order.customerId) && isRevenueOrder(order))
  const monthKeys = lastMonthKeys(ORDER_MONTHS, now)
  const orderMonths = monthKeys.map((key) => ({
    key,
    count: bookOrders.filter((order) => toMonthKey(order.orderDate) === key).length,
  }))
  const openOrders = bookOrders.filter((order) => openStatus.has(order.status))
  const latestOrders: HomeOrder[] = [...bookOrders]
    .sort((a, b) => b.orderDate.localeCompare(a.orderDate))
    .slice(0, 4)
    .map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: customerById.get(order.customerId)?.name ?? order.customerId,
      status: order.status,
      orderDate: order.orderDate,
    }))

  const cities = new Set(
    [...book].map((id) => customerById.get(id)?.city).filter((city): city is string => Boolean(city)),
  )
  const nearbyAll = (leads.data ?? [])
    .filter((lead) => lead.status !== 'lost' && cities.has(lead.city))
    .sort((a, b) => leadRank[b.status] - leadRank[a.status] || b.estimatedValue - a.estimatedValue)
  const nearbyLeads = nearbyAll.slice(0, 4)

  const deckById = new Map((decks.data ?? []).map((deck) => [deck.id, deck]))
  const followUpSessions = (sessions.data ?? [])
    .filter((session) => session.followUp && subjectNames.has(session.repName))
    .sort((a, b) => b.endedAt.localeCompare(a.endedAt))
  const followUps = followUpSessions
    .slice(0, 4)
    .map((session) => ({
      id: session.id,
      customerName: session.customerName,
      productName: deckById.get(session.deckId)?.productName ?? session.deckId,
      note: session.note,
      endedAt: session.endedAt,
    }))

  const expiring = (decks.data ?? [])
    .filter((deck) => isExpired(deck.approvedUntil) || isExpiring(deck.approvedUntil, EXPIRING_WITHIN_DAYS))
    .sort((a, b) => a.approvedUntil.localeCompare(b.approvedUntil))
    .map((deck) => ({ id: deck.id, productName: deck.productName, days: daysUntil(deck.approvedUntil) }))

  const nameOf = (activity: Activity) =>
    (activity.customerId && customerById.get(activity.customerId)?.name) || activity.title

  return {
    isLoading:
      activities.isLoading ||
      customers.isLoading ||
      orders.isLoading ||
      leads.isLoading ||
      decks.isLoading ||
      sessions.isLoading,
    error:
      activities.error ??
      customers.error ??
      orders.error ??
      leads.error ??
      decks.error ??
      sessions.error,
    today,
    todayDone,
    stops,
    weekBars,
    weekCount,
    orderMonths,
    openCount: openOrders.length,
    latestOrders,
    nearbyLeads,
    nearbyCount: nearbyAll.length,
    followUps,
    followUpCount: followUpSessions.length,
    expiring,
    nameOf,
  }
}
