export const leadStatuses = ['new', 'contacted', 'qualified', 'proposal', 'lost'] as const
export type LeadStatus = (typeof leadStatuses)[number]

export type Lead = {
  id: string
  companyName: string
  contactPerson: string
  email: string
  phone: string
  city: string
  source: string
  status: LeadStatus
  estimatedValue: number
  notes: string
  createdAt: string
}

export type NewLead = Omit<Lead, 'id'>
export type LeadUpdate = Partial<NewLead>
