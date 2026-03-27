// GET /api/tickets/[id]/time-entries — List time entries for a ticket

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getMockTimeEntries } from '@/lib/mock-data'

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
    const entries = getMockTimeEntries(ticketId)
    return Response.json(entries)
  } catch (error) {
    return handleApiError(error)
  }
}