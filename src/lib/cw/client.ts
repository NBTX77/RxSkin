import type { Ticket, TicketFilters, ScheduleEntry, ScheduleFilters, Company, Member } from '@/types'
import { normalizeTicket, normalizeScheduleEntry, normalizeCompany, normalizeMember } from './normalizers'

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

function buildAuthHeader(creds: CWCredentials): string {
  const raw = `${creds.companyId}+${creds.publicKey}:${creds.privateKey}`
  return `Basic ${Buffer.from(raw).toString('base64')}`
}

async function cwFetch<T>(creds: CWCredentials, path: string, options: RequestInit = {}): Promise<T> {
  const url = `${creds.baseUrl}${path}`
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
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') ?? '10', 10)
    throw new RateLimitError(retryAfter)
  }
  if (!response.ok) {
    const body = await response.text()
    throw new CWApiError(response.status, body)
  }
  if (response.status === 204) return null as T
  return response.json() as Promise<T>
}

// Debug helper — raw CW fetch (remove after debugging)
export async function cwFetchRaw(creds: CWCredentials, path: string): Promise<unknown> {
  return cwFetch(creds, path)
}

export async function getTickets(creds: CWCredentials, filters: TicketFilters = {}): Promise<Ticket[]> {
  const params = new URLSearchParams()
  const conditions: string[] = []
  if (filters.status?.length) conditions.push(filters.status.map(s => `status/name="${s}"`).join(' OR '))
  if (filters.boardId) conditions.push(`board/id=${filters.boardId}`)
  if (filters.companyId) conditions.push(`company/id=${filters.companyId}`)
  if (filters.assignedTo) conditions.push(`owner/identifier="${filters.assignedTo}"`)
  if (filters.search) conditions.push(`summary contains "${filters.search}"`)
  if (conditions.length) params.set('conditions', conditions.join(' AND '))
  params.set('orderBy', 'lastUpdated desc')
  params.set('pageSize', String(filters.pageSize ?? 50))
  params.set('page', String(filters.page ?? 1))
  params.set('fields', 'id,summary,status,priority,board,company,contact,owner,dateEntered,lastUpdated,closedDate,budgetHours,actualHours,resources,_info')
  const raw = await cwFetch<Record<string, unknown>[]>(creds, `/service/tickets?${params}`)
  return raw.map(normalizeTicket)
}

export async function getTicket(creds: CWCredentials, ticketId: number): Promise<Ticket> {
  const raw = await cwFetch<Record<string, unknown>>(creds, `/service/tickets/${ticketId}`)
  return normalizeTicket(raw)
}

export async function createTicket(creds: CWCredentials, data: Partial<Record<string, unknown>>): Promise<Ticket> {
  const raw = await cwFetch<Record<string, unknown>>(creds, '/service/tickets', { method: 'POST', body: JSON.stringify(data) })
  return normalizeTicket(raw)
}

export async function updateTicket(creds: CWCredentials, ticketId: number, patches: Array<{ op: string; path: string; value: unknown }>): Promise<Ticket> {
  const raw = await cwFetch<Record<string, unknown>>(creds, `/service/tickets/${ticketId}`, { method: 'PATCH', body: JSON.stringify(patches) })
  return normalizeTicket(raw)
}

export async function getTicketNotes(creds: CWCredentials, ticketId: number): Promise<Record<string, unknown>[]> {
  return cwFetch(creds, `/service/tickets/${ticketId}/notes`)
}

export async function addTicketNote(creds: CWCredentials, ticketId: number, text: string, isInternal: boolean): Promise<Record<string, unknown>> {
  return cwFetch(creds, `/service/tickets/${ticketId}/notes`, { method: 'POST', body: JSON.stringify({ text, internalAnalysisFlag: isInternal }) })
}

export async function getScheduleEntries(creds: CWCredentials, filters: ScheduleFilters): Promise<ScheduleEntry[]> {
  const params = new URLSearchParams()
  const conditions = [`dateStart >= [${filters.start}]`, `dateStart <= [${filters.end}]`]
  if (filters.memberId) conditions.push(`member/id=${filters.memberId}`)
  params.set('conditions', conditions.join(' AND '))
  params.set('pageSize', '250')
  params.set('fields', 'id,objectId,objectType,member,dateStart,dateEnd,status,type,where')
  const raw = await cwFetch<Record<string, unknown>[]>(creds, `/schedule/entries?${params}`)
  return raw.map(normalizeScheduleEntry)
}

export async function createScheduleEntry(creds: CWCredentials, data: Partial<Record<string, unknown>>): Promise<ScheduleEntry> {
  const raw = await cwFetch<Record<string, unknown>>(creds, '/schedule/entries', { method: 'POST', body: JSON.stringify(data) })
  return normalizeScheduleEntry(raw)
}

export async function updateScheduleEntry(creds: CWCredentials, entryId: number, patches: Array<{ op: string; path: string; value: unknown }>): Promise<ScheduleEntry> {
  const raw = await cwFetch<Record<string, unknown>>(creds, `/schedule/entries/${entryId}`, { method: 'PATCH', body: JSON.stringify(patches) })
  return normalizeScheduleEntry(raw)
}

export async function deleteScheduleEntry(creds: CWCredentials, entryId: number): Promise<void> {
  await cwFetch<null>(creds, `/schedule/entries/${entryId}`, { method: 'DELETE' })
}

export async function getCompanies(creds: CWCredentials, search?: string): Promise<Company[]> {
  const params = new URLSearchParams()
  if (search) params.set('conditions', `name contains "${search}"`)
  params.set('pageSize', '100')
  params.set('orderBy', 'name asc')
  params.set('fields', 'id,name,identifier,type,status,phoneNumber,website,addressLine1,city,state,zip')
  const raw = await cwFetch<Record<string, unknown>[]>(creds, `/company/companies?${params}`)
  return raw.map(normalizeCompany)
}

export async function getMembers(creds: CWCredentials): Promise<Member[]> {
  const params = new URLSearchParams()
  params.set('conditions', 'inactiveFlag=false')
  params.set('fields', 'id,identifier,firstName,lastName,emailAddress,title,photo')
  params.set('pageSize', '200')
  const raw = await cwFetch<Record<string, unknown>[]>(creds, `/system/members?${params}`)
  return raw.map(normalizeMember)
}
