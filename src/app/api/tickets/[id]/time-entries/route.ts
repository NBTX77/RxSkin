// GET /api/tickets/[id]/time-entries — List time entries for a ticket

import { auth } from '@/lib/auth/config'
import { getTenantCredentials } from '@/lib/auth/credentials'
import { getTimeEntries } from '@/lib/cw/client'
import { cachedFetch } from '@/lib/cache/bff-cache'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getMockTimeEntries } from '@/lib/mock-data'
import type { TimeEntry } from '@/types'

export const dynamic = 'force-dynamic'

const TIME_ENTRIES_TTL_MS = 30 * 1000 // 30 seconds

function isCWConfigured(): boolean {
  return !!(process.env.CW_BASE_URL && process.env.CW_PUBLIC_KEY && process.env.CW_PRIVATE_KEY)
}

/** Normalize raw CW time entry to our TimeEntry shape. */
function normalizeTimeEntry(raw: Record<string, unknown>, ticketId: number): TimeEntry {
  const member = raw.member as Record<string, unknown> | undefined
  return {
    id: (raw.id as number) ?? 0,
    ticketId,
    memberId: member ? (member.id as number) ?? 0 : 0,
    memberName: member ? (member.name as string) ?? 'Unknown' : 'Unknown',
    hoursWorked: (raw.actualHours as number) ?? (raw.hoursDebit as number) ?? 0,
    workType: (raw.workType as Record<string, unknown>)?.name as string ?? undefined,
    notes: (raw.notes as string) ?? (raw.internalNotes as string) ?? undefined,
    billable: (raw.billableOption as string) === 'Billable' || (raw.addToDetailDescriptionFlag as boolean) === true,
    date: (raw.dateEntered as string) ?? (raw.timeStart as string) ?? new Date().toISOString(),
  }
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

    // Mock data fallback when CW not configured
    if (!isCWConfigured()) {
      const entries = getMockTimeEntries(ticketId)
      return Response.json(entries)
    }

    const { tenantId } = session.user
    const cacheKey = `${tenantId}:tickets:${ticketId}:time-entries`

    const entries = await cachedFetch(
      cacheKey,
      async () => {
        const creds = await getTenantCredentials(tenantId)
        const rawEntries = await getTimeEntries(creds, ticketId)
        return rawEntries.map((e) => normalizeTimeEntry(e, ticketId))
      },
      TIME_ENTRIES_TTL_MS
    )

    return Response.json(entries)
  } catch (error) {
    return handleApiError(error)
  }
}
