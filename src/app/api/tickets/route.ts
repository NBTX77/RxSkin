import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getMockTickets } from '@/lib/mock-data'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '25', 10)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')

    let tickets = getMockTickets()

    // Apply filters
    if (status) {
      tickets = tickets.filter(t => t.status?.name?.toLowerCase() === status.toLowerCase())
    }
    if (priority) {
      tickets = tickets.filter(t => t.priority?.name?.toLowerCase() === priority.toLowerCase())
    }
    if (search) {
      const q = search.toLowerCase()
      tickets = tickets.filter(t =>
        t.summary.toLowerCase().includes(q) ||
        t.company?.name?.toLowerCase().includes(q) ||
        String(t.id).includes(q)
      )
    }

    // Paginate
    const total = tickets.length
    const start = (page - 1) * pageSize
    const paged = tickets.slice(start, start + pageSize)

    return Response.json({
      data: paged,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const body = await req.json()
    // Phase 1: return the submitted data with a mock ID
    return Response.json({ id: Date.now(), ...body }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
