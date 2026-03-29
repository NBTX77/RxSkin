// ============================================================
// GET /api/smileback/ticket/[ticketId] — CSAT survey for a specific ticket
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { smileBackClient } from '@/lib/smileback/client'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { ticketId } = await params

    const parsedTicketId = parseInt(ticketId, 10)
    if (isNaN(parsedTicketId)) {
      return apiErrors.badRequest('Invalid ticket ID')
    }

    // If SmileBack is not configured, return null survey
    if (!smileBackClient.isConfigured()) {
      return Response.json({ survey: null })
    }

    const survey = await smileBackClient.getCSATForTicket(parsedTicketId)
    return Response.json({ survey })
  } catch (error) {
    return handleApiError(error)
  }
}
