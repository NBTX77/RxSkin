// GET/PATCH /api/tickets/[id] — Get or update a single ticket

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getCWCredentials } from '@/lib/cw/credentials'
import { getTicket, updateTicket } from '@/lib/cw/client'
import { getMockTicketById } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const ticketId = parseInt(params.id, 10)
    if (isNaN(ticketId)) return apiErrors.badRequest('Invalid ticket ID')

    const creds = getCWCredentials()
    if (!creds) return apiErrors.internal('ConnectWise credentials not configured')

    const body = await request.json()
    // Accept either a JSON Patch array or a convenience object
    let patches: Array<{ op: string; path: string; value: unknown }>

    if (Array.isArray(body)) {
      patches = body
    } else {
      // Convert { status: 'Resolved', type: {...} } → JSON Patch ops
      patches = Object.entries(body).map(([key, value]) => ({
        op: 'replace',
        path: key,
        value,
      }))
    }

    const ticket = await updateTicket(creds, ticketId, patches)
    return Response.json(ticket)
  } catch (error) {
    return handleApiError(error)
  }
}
