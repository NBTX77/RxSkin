// GET /api/tickets/[id]/notes — List notes for a ticket

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getMockNotes } from '@/lib/mock-data'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const ticketId = parseInt(params.id, 10)
    if (isNaN(ticketId)) return apiErrors.badRequest('Invalid ticket ID')

    // TODO: Replace with real CW API call when credentials configured
    const notes = getMockNotes(ticketId)
    return Response.json(notes)
  } catch (error) {
    return handleApiError(error)
  }
}