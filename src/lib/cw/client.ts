// ============================================================
// ConnectWise REST API Client — RX Skin BFF Layer
// NEVER import this in client components — server-side only.
// ============================================================

import type { Ticket, TicketFilters, TicketNote, TimeEntry, ScheduleEntry, ScheduleFilters, Company, Member, Project, ProjectFilters } from '@/types'
import { normalizeTicket, normalizeScheduleEntry, normalizeCompany, normalizeMember, normalizeProject } from './normalizers'
import { logApiCall } from '@/lib/instrumentation/api-logger'
import { getDefaultTenantId } from '@/lib/instrumentation/tenant-context'

export interface CWCredentials {
  baseUrl: string
  companyId: string
  clientId: string
  publicKey: string
  privateKey: string
}

export class RateLimitError extends Error {
  retryAfterMs: number
  constructor(retryAfterSeconds: number) {
    super(`ConnectWise rate limit exceeded. Retry after ${retryAfterSeconds}s`)
    this.name = 'RateLimitError'
    this.retryAfterMs = retryAfterSeconds * 1000
  }
}

export class CWApiError extends Error {
  status: number
  detail: string
  constructor(status: number, detail: string) {
    super(`ConnectWise API error: ${status}`)
    this.name = 'CWApiError'
    this.status = status
    this.detail = detail
  }
}

/**
 * Build the Authorization header value for CW API Key auth.
 * Format: Basic Base64(companyId+publicKey:privateKey)
 */
function buildAuthHeader(creds: CWCredentials): string {
  const raw = `${creds.companyId}+${creds.publicKey}:${creds.privateKey}`
  return `Basic ${Buffer.from(raw).toString('base64')}`
}

/**
 * Core fetch wrapper with auth injection, error handling, and instrumentation.
 */
async function cwFetch<T>(
  creds: CWCredentials,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${creds.baseUrl}${path}`
  const method = (options.method ?? 'GET').toUpperCase()
  const start = performance.now()

  let statusCode: number | undefined
  let errorCode: string | undefined
  let errorMessage: string | undefined

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': buildAuthHeader(creds),
        'clientId': creds.clientId,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    })

    statusCode = response.status

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') ?? '10', 10)
      throw new RateLimitError(retryAfter)
    }

    if (!response.ok) {
      const body = await response.text()
      throw new CWApiError(response.status, body)
    }

    // 204 No Content
    if (response.status === 204) {
      return null as T
    }

    return response.json() as Promise<T>
  } catch (err) {
    if (err instanceof RateLimitError) {
      errorCode = 'RATE_LIMITED'
      errorMessage = err.message
    } else if (err instanceof CWApiError) {
      statusCode = err.status
      errorCode = 'API_ERROR'
      errorMessage = err.detail?.slice(0, 500)
    } else if (err instanceof Error) {
      errorCode = 'NETWORK_ERROR'
      errorMessage = err.message
    }
    throw err
  } finally {
    // Fire-and-forget logging — never blocks the response
    const elapsed = Math.round(performance.now() - start)
    getDefaultTenantId()
      .then((tenantId) => {
        logApiCall(
          { tenantId, platform: 'connectwise', endpoint: path, method },
          {
            statusCode,
            responseTimeMs: elapsed,
            requestPayloadSize: options.body ? String(options.body).length : undefined,
            errorCode,
            errorMessage,
          }
        )
      })
      .catch(() => {}) // Swallow — instrumentation must never break the app
  }
}

// ── Tickets ───────────────────────────────────────────────────

/** List tickets with filters. Handles pagination. */
export async function getTickets(
  creds: CWCredentials,
  filters: TicketFilters = {}
): Promise<Ticket[]> {
  const params = new URLSearchParams()

  const conditions: string[] = []
  if (filters.status?.length) {
    conditions.push(filters.status.map(s => `status/name="${s}"`).join(' OR '))
  }
  if (filters.boardId) conditions.push(`board/id=${filters.boardId}`)
  if (filters.companyId) conditions.push(`company/id=${filters.companyId}`)
  if (filters.assignedTo) conditions.push(`owner/identifier="${filters.assignedTo}"`)
  if (filters.search) conditions.push(`summary contains "${filters.search}"`)
  if (conditions.length) params.set('conditions', conditions.join(' AND '))

  params.set('orderBy', 'lastUpdated desc')
  params.set('pageSize', String(filters.pageSize ?? 50))
  params.set('page', String(filters.page ?? 1))
  params.set('fields', 'id,summary,status,priority,board,company,contact,owner,dateEntered,lastUpdated,closedDate,budgetHours,actualHours,resources')

  const raw = await cwFetch<Record<string, unknown>[]>(creds, `/service/tickets?${params}`)
  return raw.map(normalizeTicket)
}

/** Get a single ticket by ID. */
export async function getTicket(creds: CWCredentials, ticketId: number): Promise<Ticket> {
  const raw = await cwFetch<Record<string, unknown>>(creds, `/service/tickets/${ticketId}`)
  return normalizeTicket(raw)
}

/** Create a new ticket. */
export async function createTicket(
  creds: CWCredentials,
  data: Partial<Record<string, unknown>>
): Promise<Ticket> {
  const raw = await cwFetch<Record<string, unknown>>(creds, '/service/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return normalizeTicket(raw)
}

/** Partial update a ticket (JSON Patch). */
export async function updateTicket(
  creds: CWCredentials,
  ticketId: number,
  patches: Array<{ op: string; path: string; value: unknown }>
): Promise<Ticket> {
  const raw = await cwFetch<Record<string, unknown>>(creds, `/service/tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify(patches),
  })
  return normalizeTicket(raw)
}

/** Get notes for a ticket. */
export async function getTicketNotes(
  creds: CWCredentials,
  ticketId: number
): Promise<Record<string, unknown>[]> {
  return cwFetch(creds, `/service/tickets/${ticketId}/notes`)
}

/** Add a note to a ticket. */
export async function addTicketNote(
  creds: CWCredentials,
  ticketId: number,
  text: string,
  isInternal: boolean
): Promise<Record<string, unknown>> {
  return cwFetch(creds, `/service/tickets/${ticketId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ text, internalAnalysisFlag: isInternal }),
  })
}

/** List time entries for a ticket. */
export async function getTimeEntries(
  creds: CWCredentials,
  ticketId: number
): Promise<Record<string, unknown>[]> {
  return cwFetch(creds, `/time/entries?conditions=chargeToId=${ticketId} AND chargeToType="ServiceTicket"&orderBy=dateEntered desc&pageSize=50`)
}

// ── Schedule ──────────────────────────────────────────────────

/** List schedule entries for a date range. */
export async function getScheduleEntries(
  creds: CWCredentials,
  filters: ScheduleFilters
): Promise<ScheduleEntry[]> {
  const params = new URLSearchParams()

  const conditions = [
    `dateStart >= [${filters.start}]`,
    `dateStart <= [${filters.end}]`,
  ]
  if (filters.memberId) conditions.push(`member/id=${filters.memberId}`)
  params.set('conditions', conditions.join(' AND '))
  params.set('pageSize', '250')
  params.set('fields', 'id,objectId,objectType,member,dateStart,dateEnd,status,type,where,company')

  const raw = await cwFetch<Record<string, unknown>[]>(creds, `/schedule/entries?${params}`)
  return raw.map(normalizeScheduleEntry)
}

/** Create a schedule entry. */
export async function createScheduleEntry(
  creds: CWCredentials,
  data: Partial<Record<string, unknown>>
): Promise<ScheduleEntry> {
  const raw = await cwFetch<Record<string, unknown>>(creds, '/schedule/entries', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return normalizeScheduleEntry(raw)
}

/** Update (reschedule) a schedule entry. */
export async function updateScheduleEntry(
  creds: CWCredentials,
  entryId: number,
  patches: Array<{ op: string; path: string; value: unknown }>
): Promise<ScheduleEntry> {
  const raw = await cwFetch<Record<string, unknown>>(creds, `/schedule/entries/${entryId}`, {
    method: 'PATCH',
    body: JSON.stringify(patches),
  })
  return normalizeScheduleEntry(raw)
}

/** Delete a schedule entry. */
export async function deleteScheduleEntry(
  creds: CWCredentials,
  entryId: number
): Promise<void> {
  await cwFetch<null>(creds, `/schedule/entries/${entryId}`, { method: 'DELETE' })
}

// ── Projects ──────────────────────────────────────────────────

/** List projects with filters. */
export async function getProjects(
  creds: CWCredentials,
  filters: ProjectFilters = {}
): Promise<Project[]> {
  const params = new URLSearchParams()

  const conditions: string[] = []
  if (filters.closedFlag === false) conditions.push('closedFlag=false')
  if (filters.closedFlag === true) conditions.push('closedFlag=true')
  if (filters.board) conditions.push(`board/name="${filters.board}"`)
  // Support filtering by multiple CW department names (OR logic)
  if (filters.cwDepartments && filters.cwDepartments.length > 0) {
    if (filters.cwDepartments.length === 1) {
      conditions.push(`department/name="${filters.cwDepartments[0]}"`)
    } else {
      const deptClauses = filters.cwDepartments.map(d => `department/name="${d}"`).join(' OR ')
      conditions.push(`(${deptClauses})`)
    }
  }
  if (filters.status) conditions.push(`status/name="${filters.status}"`)
  if (filters.managerId) conditions.push(`manager/identifier="${filters.managerId}"`)
  if (filters.companyId) conditions.push(`company/id=${filters.companyId}`)
  if (filters.search) conditions.push(`name contains "${filters.search}"`)
  if (conditions.length) params.set('conditions', conditions.join(' AND '))

  params.set('orderBy', 'id desc')
  params.set('pageSize', '250')
  params.set('fields', 'id,name,status,board,department,company,manager,estimatedStart,estimatedEnd,actualStart,actualEnd,budgetHours,actualHours,billingMethod,closedFlag')

  const raw = await cwFetch<Record<string, unknown>[]>(creds, `/project/projects?${params}`)
  return raw.map(normalizeProject)
}

/** Get a single project by ID. */
export async function getProject(creds: CWCredentials, projectId: number): Promise<Project> {
  const raw = await cwFetch<Record<string, unknown>>(creds, `/project/projects/${projectId}`)
  return normalizeProject(raw)
}

/** Update project status (for kanban drag-drop). */
export async function updateProject(
  creds: CWCredentials,
  projectId: number,
  patches: Array<{ op: string; path: string; value?: unknown }>
): Promise<Project> {
  const raw = await cwFetch<Record<string, unknown>>(creds, `/project/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(patches),
  })
  return normalizeProject(raw)
}

// ── Companies ─────────────────────────────────────────────────

/** List companies. */
export async function getCompanies(
  creds: CWCredentials,
  search?: string
): Promise<Company[]> {
  const params = new URLSearchParams()
  if (search) params.set('conditions', `name contains "${search}"`)
  params.set('pageSize', '100')
  params.set('orderBy', 'name asc')
  params.set('fields', 'id,name,identifier,type,status,phoneNumber,website,addressLine1,city,state,zip')

  const raw = await cwFetch<Record<string, unknown>[]>(creds, `/company/companies?${params}`)
  return raw.map(normalizeCompany)
}

// ── Members ───────────────────────────────────────────────────

/** List all members (technicians). */
export async function getMembers(creds: CWCredentials): Promise<Member[]> {
  const params = new URLSearchParams()
  params.set('conditions', 'inactiveFlag=false')
  params.set('fields', 'id,identifier,firstName,lastName,emailAddress,title,photo')
  params.set('pageSize', '200')

  const raw = await cwFetch<Record<string, unknown>[]>(creds, `/system/members?${params}`)
  return raw.map(normalizeMember)
}
