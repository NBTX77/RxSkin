// ============================================================
// GET /api/tickets  — List tickets
// POST /api/tickets — Create ticket
// ============================================================

import { auth } from '@/lib/auth/config'
import { getTenantCredentials } from '@/lib/auth/credentials'
import { getTickets, createTicket } from '@/lib/cw/client'
import { cachedFetch, invalidateCache } from '@/lib/cache/bff-cache'
import { deduplicatedFetch } from '@/lib/cache/dedup'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getMockTickets } from '@/lib/mock-data'
import { z } from 'zod'
import type { TicketFilters } from '@/types'

export const dynamic = 'force-dynamic'

const TICKET_LIST_TTL_MS = 60 * 1000 // 60 seconds

function isCWConfigured(): boolean {
  return !!(process.env.CW_BASE_URL && process.env.CW_PUBLIC_KEY && process.env.CW_PRIVATE_KEY)
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    // If CW credentials not configured, return mock data for testing
    if (!isCWConfigured()) {
      let tickets = getMockTickets()
      const { searchParams } = new URL(request.url)
      const searchTerm = searchParams.get('search')?.toLowerCase()
      if (searchTerm) {
        tickets = tickets.filter(t =>
          t.summary.toLowerCase().includes(searchTerm) ||
          t.company.toLowerCase().includes(searchTerm) ||
          String(t.id).includes(searchTerm)
        )
      }
      return Response.json(tickets)
    }

    const { tenantId } = session.user
    const { searchParams } = new URL(request.url)

    const filters: TicketFilters = {
      status: searchParams.getAll('status'),
      boardId: searchParams.get('boardId') ? Number(searchParams.get('boardId')) : undefined,
      companyId: searchParams.get('companyId') ? Number(searchParams.get('companyId')) : undefined,
      assignedTo: searchParams.get('assignedTo') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : 50,
    }

    const cacheKey = `${tenantId}:tickets:list:${JSON.stringify(filters)}`

    const tickets = await deduplicatedFetch(cacheKey, () =>
      cachedFetch(
        cacheKey,
        async () => {
          const creds = await getTenantCredentials(tenantId)
          return getTickets(creds, filters)
        },
        TICKET_LIST_TTL_MS
      )
    )

    return Response.json(tickets)
  } catch (error) {
    return handleApiError(error)
  }
}

const createTicketSchema = z.object({
  summary: z.string().min(1).max(200),
  boardId: z.number(),
  companyId: z.number(),
  contactId: z.number().optional(),
  statusId: z.number().optional(),
  priorityId: z.number().optional(),
  assignedToId: z.string().optional(),
  description: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()
    if (session.user.role === 'VIEWER') return apiErrors.forbidden()

    const { tenantId } = session.user
    const body = await request.json()

    const parsed = createTicketSchema.safeParse(body)
    if (!parsed.success) {
      return apiErrors.badRequest(parsed.error.issues.map(i => i.message).join(', '))
    }

    const creds = await getTenantCredentials(tenantId)
    const ticket = await createTicket(creds, {
      summary: parsed.data.summary,
      board: { id: parsed.data.boardId },
      company: { id: parsed.data.companyId },
      contact: parsed.data.contactId ? { id: parsed.data.contactId } : undefined,
      status: parsed.data.statusId ? { id: parsed.data.statusId } : undefined,
      priority: parsed.data.priorityId ? { id: parsed.data.priorityId } : undefined,
      owner: parsed.data.assignedToId ? { identifier: parsed.data.assignedToId } : undefined,
      initialDescription: parsed.data.description,
    })

    // Bust list caches so new ticket appears
    invalidateCache(`${tenantId}:tickets:list:`)

    return Response.json(ticket, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
