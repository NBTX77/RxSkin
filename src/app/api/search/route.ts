// GET /api/search?q=term — Global search across tickets, companies, members

import { auth } from '@/lib/auth/config'
import { getTenantCredentials } from '@/lib/auth/credentials'
import { getTickets, getCompanies, getMembers } from '@/lib/cw/client'
import { cachedFetch } from '@/lib/cache/bff-cache'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getMockTickets, getMockMembers } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

const SEARCH_TTL_MS = 15 * 1000 // 15 seconds

function isCWConfigured(): boolean {
  return !!(process.env.CW_BASE_URL && process.env.CW_PUBLIC_KEY && process.env.CW_PRIVATE_KEY)
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') ?? '').toLowerCase().trim()

    if (!q) return Response.json({ tickets: [], companies: [], members: [] })

    // Mock data fallback when CW not configured
    if (!isCWConfigured()) {
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
    }

    // Live CW search
    const { tenantId } = session.user
    const cacheKey = `${tenantId}:search:${q}`

    const results = await cachedFetch(
      cacheKey,
      async () => {
        const creds = await getTenantCredentials(tenantId)

        // Search tickets by summary containing the query
        const tickets = await getTickets(creds, {
          search: q,
          pageSize: 8,
        })

        // Search companies
        const allCompanies = await cachedFetch(
          `${tenantId}:companies:list`,
          () => getCompanies(creds),
          60 * 1000
        )
        const companies = allCompanies
          .filter((c) => c.name.toLowerCase().includes(q))
          .slice(0, 5)
          .map((c) => ({ id: c.id, name: c.name }))

        // Search members
        const allMembers = await cachedFetch(
          `${tenantId}:members:list`,
          () => getMembers(creds),
          60 * 1000
        )
        const members = allMembers
          .filter((m) =>
            m.name.toLowerCase().includes(q) ||
            m.identifier.toLowerCase().includes(q)
          )
          .slice(0, 5)

        return { tickets, companies, members }
      },
      SEARCH_TTL_MS
    )

    return Response.json(results)
  } catch (error) {
    return handleApiError(error)
  }
}
