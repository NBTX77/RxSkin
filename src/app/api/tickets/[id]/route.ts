// GET /api/tickets/[id] — Get a single ticket by ID

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getMockTicketById } from '@/lib/mock-data'

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
    const ticket = getMockTicketById(ticketId)
    if (!ticket) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 })
    }

    return Response.json(ticket)
  } catch (error) {
    return handleApiError(error)
  }
}