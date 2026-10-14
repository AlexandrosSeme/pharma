export const customerTypes = ['Pharmacy', 'Clinic', 'Hospital'] as const
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
  vatNumber: string
  status: CustomerStatus
  createdAt: string
}

export type NewCustomer = Omit<Customer, 'id'>
export type CustomerUpdate = Partial<NewCustomer>
