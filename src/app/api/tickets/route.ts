import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getCWCredentials } from '@/lib/cw/credentials'
import { getTickets } from '@/lib/cw/client'
import { getMockTickets } from '@/lib/mock-data'
import type { Ticket } from '@/types'

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

    let tickets: Ticket[]

    const creds = getCWCredentials()
    if (creds) {
      // Live ConnectWise data
      tickets = await getTickets(creds, {
        search: search?.trim() || undefined,
        page,
        pageSize,
      })

      // Client-side filters for status/priority (CW conditions syntax differs)
      if (status && status.toLowerCase() !== 'all') {
        tickets = tickets.filter(t => t.status.toLowerCase().includes(status.toLowerCase()))
      }
      if (priority && priority.toLowerCase() !== 'all') {
        tickets = tickets.filter(t => t.priority.toLowerCase().includes(priority.toLowerCase()))
      }

      return Response.json({
        data: tickets,
        pagination: { page, pageSize, total: tickets.length, totalPages: 1 },
        source: 'connectwise',
      })
    } else {
      // Mock data fallback
      tickets = getMockTickets()

      if (status && status.toLowerCase() !== 'all') {
        tickets = tickets.filter(t => t.status.toLowerCase() === status.toLowerCase())
      }
      if (priority && priority.toLowerCase() !== 'all') {
        tickets = tickets.filter(t => t.priority.toLowerCase() === priority.toLowerCase())
      }
      if (search && search.trim()) {
        const q = search.toLowerCase()
        tickets = tickets.filter(t =>
          t.summary.toLowerCase().includes(q) ||
          t.company?.toLowerCase().includes(q) ||
          String(t.id).includes(q)
        )
      }

      const total = tickets.length
      const start = (page - 1) * pageSize
      const paged = tickets.slice(start, start + pageSize)

      return Response.json({
        data: paged,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        source: 'mock',
      })
    }
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
