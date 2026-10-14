export const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const
export type OrderStatus = (typeof orderStatuses)[number]

export type OrderItem = {
  productId: string
  quantity: number
  unitPrice: number
}

export type Order = {
  id: string
  orderNumber: string
  customerId: string
  orderDate: string
  status: OrderStatus
  items: OrderItem[]
  total: number
}

export type NewOrder = Omit<Order, 'id'>
export type OrderUpdate = Partial<NewOrder>

export type OrderRow = Order & { customerName: string }
