// ============================================================
// GET /api/tickets/[id]   — Ticket detail
// PATCH /api/tickets/[id] — Update ticket
// ============================================================

import { auth } from '@/lib/auth/config'
import { getTenantCredentials } from '@/lib/auth/credentials'
import { getTicket, updateTicket } from '@/lib/cw/client'
import { cachedFetch, invalidateCacheKey, invalidateCache } from '@/lib/cache/bff-cache'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const TICKET_DETAIL_TTL_MS = 30 * 1000 // 30 seconds

function isCWConfigured(): boolean {
  return !!(process.env.CW_BASE_URL && process.env.CW_PUBLIC_KEY && process.env.CW_PRIVATE_KEY)
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
    const cacheKey = `${tenantId}:tickets:detail:${ticketId}`

    const ticket = await cachedFetch(
      cacheKey,
      async () => {
        const creds = await getTenantCredentials(tenantId)
        return getTicket(creds, ticketId)
      },
      TICKET_DETAIL_TTL_MS
    )

    return Response.json(ticket)
  } catch (error) {
    return handleApiError(error)
  }
}

const patchSchema = z.array(
  z.object({
    op: z.enum(['replace', 'add', 'remove']),
    path: z.string().startsWith('/'),
    value: z.unknown().optional().transform(v => v ?? null),
  })
)

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()
    if (session.user.role === 'VIEWER') return apiErrors.forbidden()

    const { tenantId } = session.user
    const ticketId = parseInt(params.id, 10)
    if (isNaN(ticketId)) return apiErrors.badRequest('Invalid ticket ID')

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return apiErrors.badRequest('Body must be a JSON Patch array')
    }

    const creds = await getTenantCredentials(tenantId)
    const updated = await updateTicket(creds, ticketId, parsed.data)

    // Bust caches
    invalidateCacheKey(`${tenantId}:tickets:detail:${ticketId}`)
    invalidateCache(`${tenantId}:tickets:list:`)

    return Response.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
