import type { Ticket, ScheduleEntry, Company, Member } from '@/types'

function str(val: unknown): string {
  if (typeof val === 'string') return val
  return ''
}

function num(val: unknown): number | undefined {
  if (typeof val === 'number') return val
  return undefined
}

function nested(obj: unknown, key: string): string {
  if (obj && typeof obj === 'object') return str((obj as Record<string, unknown>)[key])
  return ''
}

function nestedNum(obj: unknown, key: string): number | undefined {
  if (obj && typeof obj === 'object') return num((obj as Record<string, unknown>)[key])
  return undefined
}

export function normalizeTicket(raw: Record<string, unknown>): Ticket {
  return {
    id: num(raw.id) ?? 0,
    summary: str(raw.summary),
    status: nested(raw.status, 'name') || 'Unknown',
    statusId: nestedNum(raw.status, 'id'),
    priority: nested(raw.priority, 'name') || 'Medium',
    priorityId: nestedNum(raw.priority, 'id'),
    board: nested(raw.board, 'name') || 'Unknown',
    boardId: nestedNum(raw.board, 'id'),
    company: nested(raw.company, 'name') || 'Unknown',
    companyId: nestedNum(raw.company, 'id'),
    contact: nested(raw.contact, 'name') || undefined,
    contactId: nestedNum(raw.contact, 'id'),
    assignedTo: nested(raw.owner, 'name') || undefined,
    assignedToId: nested(raw.owner, 'identifier') || undefined,
    budgetHours: num(raw.budgetHours),
    actualHours: num(raw.actualHours),
    createdAt: str(raw.dateEntered),
    updatedAt: str(raw.lastUpdated),
    closedAt: str(raw.closedDate) || undefined,
    resources: Array.isArray(raw.resources)
      ? raw.resources.map((r: Record<string, unknown>) => ({
          memberId: nestedNum(r.member, 'id') ?? 0,
          memberName: nested(r.member, 'name'),
          primaryFlag: Boolean(r.primaryFlag),
        }))
      : [],
  }
}

export function normalizeScheduleEntry(raw: Record<string, unknown>): ScheduleEntry {
  return {
    id: num(raw.id) ?? 0,
    ticketId: nestedNum(raw.where, 'id'),
    ticketSummary: nested(raw.where, 'summary') || undefined,
    memberId: nestedNum(raw.member, 'id') ?? 0,
    memberName: nested(raw.member, 'name'),
    start: str(raw.dateStart),
    end: str(raw.dateEnd),
    status: nested(raw.status, 'name') || 'Scheduled',
    type: nested(raw.type, 'name') || 'Service',
    companyId: nestedNum(raw.company, 'id'),
    companyName: nested(raw.company, 'name') || undefined,
  }
}

export function normalizeCompany(raw: Record<string, unknown>): Company {
  return {
    id: num(raw.id) ?? 0,
    name: str(raw.name),
    identifier: str(raw.identifier),
    type: nested(raw.type, 'name') || undefined,
    status: nested(raw.status, 'name') || undefined,
    phone: str(raw.phoneNumber) || undefined,
    website: str(raw.website) || undefined,
    addressLine1: str(raw.addressLine1) || undefined,
    city: str(raw.city) || undefined,
    state: str(raw.state) || undefined,
    zip: str(raw.zip) || undefined,
  }
}

export function normalizeMember(raw: Record<string, unknown>): Member {
  const firstName = str(raw.firstName)
  const lastName = str(raw.lastName)
  return {
    id: num(raw.id) ?? 0,
    identifier: str(raw.identifier),
    name: [firstName, lastName].filter(Boolean).join(' ') || str(raw.identifier),
    email: str(raw.emailAddress) || undefined,
    title: str(raw.title) || undefined,
    avatar: nestedNum(raw.photo, 'id') ? `/api/members/${num(raw.id)}/avatar` : undefined,
  }
}
