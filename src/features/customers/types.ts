export const customerTypes = ['Pharmacy', 'Clinic', 'Hospital', 'Eopyy'] as const
export type CustomerType = (typeof customerTypes)[number]

export type CustomerStatus = 'active' | 'inactive'

export type Customer = {
  id: string
  name: string
  type: CustomerType
  contactPerson: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  /** Geocoded from the address; missing for customers that could not be located. */
  latitude?: number
  longitude?: number
  vatNumber: string
  status: CustomerStatus
  /** The sales rep who owns this account. Managers see the reps on their own team. */
  repId?: string
  createdAt: string
}

export type NewCustomer = Omit<Customer, 'id'>
export type CustomerUpdate = Partial<NewCustomer>
