export const leadStatuses = ['new', 'contacted', 'qualified', 'proposal', 'lost'] as const
export type LeadStatus = (typeof leadStatuses)[number]

export const leadEventKinds = ['opened', 'status', 'call', 'note'] as const
export type LeadEventKind = (typeof leadEventKinds)[number]

export type LeadEvent = {
  id: string
  kind: LeadEventKind
  at: string
  text?: string
  status?: LeadStatus
  /** The person who wrote this line. Absent on the record that came in with the lead. */
  by?: string
}

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
  /** What was said and how the stage moved. Missing on older records; the page builds it. */
  events?: LeadEvent[]
  /** `YYYY-MM-DD`. When to call again. */
  followUpAt?: string
}

export type NewLead = Omit<Lead, 'id'>
export type LeadUpdate = Partial<NewLead>
