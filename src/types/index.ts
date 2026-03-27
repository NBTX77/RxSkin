export interface Ticket {
  id: number
  summary: string
  status: string
  statusId?: number
  priority: string
  priorityId?: number
  board: string
  boardId?: number
  company: string
  companyId?: number
  contact?: string
  contactId?: number
  assignedTo?: string
  assignedToId?: string
  budgetHours?: number
  actualHours?: number
  createdAt: string
  updatedAt: string
  closedAt?: string
  resources?: TicketResource[]
}

export interface TicketResource {
  memberId: number
  memberName: string
  primaryFlag: boolean
}

export interface TicketNote {
  id: number
  ticketId: number
  text: string
  isInternal: boolean
  createdBy: string
  createdAt: string
}

export interface TimeEntry {
  id: number
  ticketId: number
  memberId: number
  memberName: string
  hoursWorked: number
  workType?: string
  notes?: string
  billable: boolean
  date: string
}

export interface TicketFilters {
  status?: string[]
  boardId?: number
  priority?: string[]
  assignedTo?: string
  companyId?: number
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface ScheduleEntry {
  id: number
  ticketId?: number
  ticketSummary?: string
  memberId: number
  memberName: string
  start: string
  end: string
  status: string
  type: string
  companyId?: number
  companyName?: string
}

export interface ScheduleFilters {
  start: string
  end: string
  memberId?: number
}

export interface Company {
  id: number
  name: string
  identifier: string
  type?: string
  status?: string
  phone?: string
  website?: string
  addressLine1?: string
  city?: string
  state?: string
  zip?: string
}

export interface Contact {
  id: number
  firstName: string
  lastName: string
  email?: string
  phone?: string
  title?: string
  companyId: number
  companyName: string
}

export interface Member {
  id: number
  identifier: string
  name: string
  email?: string
  title?: string
  avatar?: string
}

export interface ApiError {
  code: string
  message: string
  retryable: boolean
  retryAfter?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export type UserRole = 'ADMIN' | 'TECHNICIAN' | 'VIEWER'

export interface SessionUser {
  id: string
  email: string
  name: string
  tenantId: string
  role: UserRole
  cwMemberId?: string
}

export type CalendarView = 'day' | 'week' | 'twoWeek' | 'month' | 'agenda'

export interface DateRange {
  start: string
  end: string
}
