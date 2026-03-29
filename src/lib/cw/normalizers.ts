// ============================================================
// CW API Response Normalizers — RX Skin
// Maps verbose CW API responses to clean frontend types.
// CW tickets have 60+ fields — we only need ~20.
// ============================================================

import type { Ticket, ScheduleEntry, Company, Member, Project } from '@/types'
import { cwDeptToRxDept } from '@/types'

// ── Helpers ───────────────────────────────────────────────────

function str(val: unknown): string {
  if (typeof val === 'string') return val
  return ''
}

function num(val: unknown): number | undefined {
  if (typeof val === 'number') return val
  return undefined
}

function nested(obj: unknown, key: string): string {
  if (obj && typeof obj === 'object') {
    return str((obj as Record<string, unknown>)[key])
  }
  return ''
}

function nestedNum(obj: unknown, key: string): number | undefined {
  if (obj && typeof obj === 'object') {
    return num((obj as Record<string, unknown>)[key])
  }
  return undefined
}

function normalizePriority(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes('critical') || lower.includes('priority 1')) return 'Critical'
  if (lower.includes('high') || lower.includes('priority 2')) return 'High'
  if (lower.includes('medium') || lower.includes('priority 3')) return 'Medium'
  if (lower.includes('low') || lower.includes('priority 4')) return 'Low'
  if (lower.includes('do not respond')) return 'Low'
  return 'Medium'
}

// ── Ticket ────────────────────────────────────────────────────

export function normalizeTicket(raw: Record<string, unknown>): Ticket {
  return {
    id: num(raw.id) ?? 0,
    summary: str(raw.summary),
    status: nested(raw.status, 'name') || 'Unknown',
    statusId: nestedNum(raw.status, 'id'),
    priority: normalizePriority(nested(raw.priority, 'name') || 'Medium'),
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
    // CW returns resources as a comma-separated string of member identifiers
    // (e.g. "DScrip" or "DScrip, CLittle"), not an array of objects
    resources: typeof raw.resources === 'string' && raw.resources
      ? raw.resources.split(',').map((identifier: string, i: number) => ({
          memberId: 0,  // identifier only — no ID available from this field
          memberName: identifier.trim(),
          primaryFlag: i === 0,
        }))
      : Array.isArray(raw.resources)
        ? raw.resources.map((r: Record<string, unknown>) => ({
            memberId: nestedNum(r.member, 'id') ?? 0,
            memberName: nested(r.member, 'name'),
            primaryFlag: Boolean(r.primaryFlag),
          }))
        : [],
  }
}

// ── Schedule Entry ────────────────────────────────────────────

export function normalizeScheduleEntry(raw: Record<string, unknown>): ScheduleEntry {
  return {
    id: num(raw.id) ?? 0,
    ticketId: raw.objectId ? num(raw.objectId) : undefined,
    ticketSummary: nested(raw.where, 'summary') || str(raw.name) || undefined,
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

// ── Company ───────────────────────────────────────────────────

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

// ── Project ───────────────────────────────────────────────────

export function normalizeProject(raw: Record<string, unknown>): Project {
  return {
    id: num(raw.id) ?? 0,
    name: str(raw.name),
    status: nested(raw.status, 'name') || 'Unknown',
    statusId: nestedNum(raw.status, 'id'),
    board: nested(raw.board, 'name') || 'Unknown',
    boardId: nestedNum(raw.board, 'id'),
    // CW returns full department names ("Systems Integration", "IT", "G&A")
    // Map to internal RX dept codes (SI, IT, GA, AM, LT) for frontend filtering
    department: cwDeptToRxDept(nested(raw.department, 'name') || undefined),
    company: nested(raw.company, 'name') || 'Unknown',
    companyId: nestedNum(raw.company, 'id'),
    manager: nested(raw.manager, 'identifier') || undefined,
    managerId: nested(raw.manager, 'identifier') || undefined,
    estimatedStart: str(raw.estimatedStart) || undefined,
    estimatedEnd: str(raw.estimatedEnd) || undefined,
    actualStart: str(raw.actualStart) || undefined,
    actualEnd: str(raw.actualEnd) || undefined,
    budgetHours: num(raw.budgetHours) ?? 0,
    actualHours: num(raw.actualHours) ?? 0,
    billingMethod: str(raw.billingMethod) || undefined,
    closedFlag: raw.closedFlag === true,
  }
}

// ── Member ────────────────────────────────────────────────────

export function normalizeMember(raw: Record<string, unknown>): Member {
  const firstName = str(raw.firstName)
  const lastName = str(raw.lastName)
  const cwDeptName = nested(raw.defaultDepartment, 'name') || undefined
  return {
    id: num(raw.id) ?? 0,
    identifier: str(raw.identifier),
    name: [firstName, lastName].filter(Boolean).join(' ') || str(raw.identifier),
    email: str(raw.emailAddress) || undefined,
    title: str(raw.title) || undefined,
    avatar: nestedNum(raw.photo, 'id')
      ? `/api/members/${num(raw.id)}/avatar`
      : undefined,
    department: cwDeptToRxDept(cwDeptName),
    defaultDepartment: cwDeptName,
  }
}
