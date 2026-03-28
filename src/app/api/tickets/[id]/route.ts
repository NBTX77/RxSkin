// GET /api/tickets/[id] — Get a single ticket by ID

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getCWCredentials } from '@/lib/cw/credentials'
import { getTicket } from '@/lib/cw/client'
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

    const creds = getCWCredentials()
    if (creds) {
      const ticket = await getTicket(creds, ticketId)
      return Response.json(ticket)
    } else {
      const ticket = getMockTicketById(ticketId)
      if (!ticket) {
        return Response.json({ error: 'Ticket not found' }, { status: 404 })
      }
      return Response.json(ticket)
    }
  } catch (error) {
    return handleApiError(error)
  }
}
