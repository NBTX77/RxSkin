import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getCWCredentials } from '@/lib/cw/credentials'
import { getTickets } from '@/lib/cw/client'
import { getMockTickets } from '@/lib/mock-data'
import type { Ticket } from '@/types'

export const dynamic = 'force-dynamic'

/** Returns distinct values for board, company, priority, status, and assignedTo
 *  so the ticket list page can populate filter dropdowns. */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    let tickets: Ticket[]

    const creds = getCWCredentials()
    if (creds) {
      // Fetch a large page to get good filter coverage
      tickets = await getTickets(creds, { pageSize: 200 })
    } else {
      tickets = getMockTickets()
    }

    const boards = Array.from(new Set(tickets.map(t => t.board).filter(Boolean))).sort()
    const companies = Array.from(new Set(tickets.map(t => t.company).filter(Boolean))).sort()
    const priorities = Array.from(new Set(tickets.map(t => t.priority).filter(Boolean))).sort()
    const statuses = Array.from(new Set(tickets.map(t => t.status).filter(Boolean))).sort()
    const assignees = Array.from(
      new Set(tickets.map(t => t.assignedTo).filter((v): v is string => Boolean(v)))
    ).sort()

    return Response.json({
      boards,
      companies,
      priorities,
      statuses,
      assignees,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
