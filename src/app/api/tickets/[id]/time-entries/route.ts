// GET /api/tickets/[id]/time-entries — List time entries for a ticket

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getCWCredentials } from '@/lib/cw/credentials'
import { getMockTimeEntries } from '@/lib/mock-data'
import type { CWCredentials } from '@/lib/cw/client'
import type { TimeEntry } from '@/types'

export const dynamic = 'force-dynamic'

function str(val: unknown): string {
  return typeof val === 'string' ? val : ''
}

function num(val: unknown): number {
  return typeof val === 'number' ? val : 0
}

function nested(obj: unknown, key: string): string {
  if (obj && typeof obj === 'object') return str((obj as Record<string, unknown>)[key])
  return ''
}

function nestedNum(obj: unknown, key: string): number {
  if (obj && typeof obj === 'object') return num((obj as Record<string, unknown>)[key])
  return 0
}

function normalizeTimeEntry(raw: Record<string, unknown>, ticketId: number): TimeEntry {
  return {
    id: num(raw.id),
    ticketId,
    memberId: nestedNum(raw.member, 'id'),
    memberName: nested(raw.member, 'name') || nested(raw.member, 'identifier'),
    hoursWorked: typeof raw.actualHours === 'number' ? raw.actualHours : num(raw.hoursDebit),
    workType: nested(raw.workType, 'name') || undefined,
    notes: str(raw.notes) || str(raw.internalNotes) || undefined,
    billable: str(raw.billableOption) !== 'DoNotBill',
    date: str(raw.timeStart) || str(raw.dateEntered),
  }
}

async function getCWTimeEntries(creds: CWCredentials, ticketId: number): Promise<TimeEntry[]> {
  const params = new URLSearchParams()
  params.set('conditions', `chargeToId=${ticketId} AND chargeToType="ServiceTicket"`)
  params.set('fields', 'id,member,actualHours,hoursDebit,workType,notes,internalNotes,billableOption,timeStart,dateEntered')
  params.set('pageSize', '100')
  params.set('orderBy', 'timeStart desc')

  const url = `${creds.baseUrl}/time/entries?${params}`
  const raw = `${creds.companyId}+${creds.publicKey}:${creds.privateKey}`
  const authHeader = `Basic ${Buffer.from(raw).toString('base64')}`

  const res = await fetch(url, {
    headers: {
      'Authorization': authHeader,
      'clientId': creds.clientId,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })

  if (!res.ok) return []
  const data = await res.json() as Record<string, unknown>[]
  return data.map(r => normalizeTimeEntry(r, ticketId))
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const ticketId = parseInt(params.id, 10)
    if (isNaN(ticketId)) return apiErrors.badRequest('Invalid ticket ID')

    const creds = getCWCredentials()
    if (creds) {
      const entries = await getCWTimeEntries(creds, ticketId)
      return Response.json(entries)
    } else {
      const entries = getMockTimeEntries(ticketId)
      return Response.json(entries)
    }
  } catch (error) {
    return handleApiError(error)
  }
}
