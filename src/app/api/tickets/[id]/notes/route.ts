// GET /api/tickets/[id]/notes — List notes for a ticket

import { auth } from '@/lib/auth/config'
import { getTenantCredentials } from '@/lib/auth/credentials'
import { getTicketNotes } from '@/lib/cw/client'
import { cachedFetch } from '@/lib/cache/bff-cache'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getMockNotes } from '@/lib/mock-data'
import type { TicketNote } from '@/types'

export const dynamic = 'force-dynamic'

const NOTES_TTL_MS = 30 * 1000 // 30 seconds

function isCWConfigured(): boolean {
  return !!(process.env.CW_BASE_URL && process.env.CW_PUBLIC_KEY && process.env.CW_PRIVATE_KEY)
}

/** Normalize raw CW note to our TicketNote shape. */
function normalizeNote(raw: Record<string, unknown>, ticketId: number): TicketNote {
  const member = raw.member as Record<string, unknown> | undefined
  return {
    id: (raw.id as number) ?? 0,
    ticketId,
    text: (raw.text as string) ?? '',
    isInternal: (raw.internalAnalysisFlag as boolean) ?? false,
    createdBy: member
      ? `${(member.name as string) ?? 'Unknown'}`
      : (raw._info as Record<string, unknown>)?.updatedBy as string ?? 'System',
    createdAt: (raw.dateCreated as string) ?? (raw._info as Record<string, unknown>)?.lastUpdated as string ?? new Date().toISOString(),
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
      const notes = getMockNotes(ticketId)
      return Response.json(notes)
    }

    const { tenantId } = session.user
    const cacheKey = `${tenantId}:tickets:${ticketId}:notes`

    const notes = await cachedFetch(
      cacheKey,
      async () => {
        const creds = await getTenantCredentials(tenantId)
        const rawNotes = await getTicketNotes(creds, ticketId)
        return rawNotes.map((n) => normalizeNote(n, ticketId))
      },
      NOTES_TTL_MS
    )

    return Response.json(notes)
  } catch (error) {
    return handleApiError(error)
  }
}
