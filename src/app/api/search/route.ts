// GET /api/search?q=term — Global search across tickets, companies, members

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getMockTickets, getMockMembers } from '@/lib/mock-data'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') ?? '').toLowerCase().trim()

    if (!q) return Response.json({ tickets: [], companies: [], members: [] })

    const allTickets = getMockTickets()
    const allMembers = getMockMembers()

    const tickets = allTickets.filter(t =>
      t.summary.toLowerCase().includes(q) ||
      t.company.toLowerCase().includes(q) ||
      String(t.id).includes(q)
    ).slice(0, 8)
    const companyMap = new Map<string, { id: number | undefined; name: string }>()
    allTickets.forEach(t => {
      if (!companyMap.has(t.company)) companyMap.set(t.company, { id: t.companyId, name: t.company })
    })
    const companies = Array.from(companyMap.values())
      .filter(c => c.name.toLowerCase().includes(q))
      .slice(0, 5)

    const members = allMembers.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.identifier.toLowerCase().includes(q)
    ).slice(0, 5)

    return Response.json({ tickets, companies, members })
  } catch (error) {
    return handleApiError(error)
  }
}