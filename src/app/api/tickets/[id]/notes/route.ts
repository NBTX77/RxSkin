// GET  /api/tickets/[id]/notes — List notes for a ticket
// POST /api/tickets/[id]/notes — Add a note to a ticket

import { auth } from '@/lib/auth/config'
import { getTenantCredentials } from '@/lib/auth/credentials'
import { getTicketNotes, addTicketNote } from '@/lib/cw/client'
import { cachedFetch, invalidateCacheKey } from '@/lib/cache/bff-cache'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { z } from 'zod'
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

    if (!isCWConfigured()) {
      return Response.json(
        { code: 'SERVICE_UNAVAILABLE', message: 'ConnectWise API not configured', retryable: false },
        { status: 503 }
      )
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

const addNoteSchema = z.object({
  text: z.string().min(1).max(10000),
  isInternal: z.boolean().optional().default(false),
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()
    if (session.user.role === 'VIEWER') return apiErrors.forbidden()

    const ticketId = parseInt(params.id, 10)
    if (isNaN(ticketId)) return apiErrors.badRequest('Invalid ticket ID')

    if (!isCWConfigured()) {
      return Response.json(
        { code: 'SERVICE_UNAVAILABLE', message: 'ConnectWise API not configured', retryable: false },
        { status: 503 }
      )
    }

    const body = await request.json()
    const parsed = addNoteSchema.safeParse(body)
    if (!parsed.success) {
      return apiErrors.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body')
    }

    const { tenantId } = session.user
    const creds = await getTenantCredentials(tenantId)
    const rawNote = await addTicketNote(creds, ticketId, parsed.data.text, parsed.data.isInternal)

    // Bust notes cache
    invalidateCacheKey(`${tenantId}:tickets:${ticketId}:notes`)

    return Response.json(normalizeNote(rawNote, ticketId), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
