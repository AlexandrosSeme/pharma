export type Visit = {
  id: string
  customerId: string
  repId: string
  repName: string
  checkedInAt: string
  /** Device position at check-in. */
  latitude: number
  longitude: number
  accuracy: number
  /** Straight-line meters between the rep and the customer's address; missing if the customer has no coordinates. */
  distanceToCustomer?: number
}

export type NewVisit = Omit<Visit, 'id'>

export type VisitRow = Visit & { customerName: string }

/** Check-ins farther than this from the customer's address are flagged for the office. */
export const AWAY_FROM_CUSTOMER_M = 300
