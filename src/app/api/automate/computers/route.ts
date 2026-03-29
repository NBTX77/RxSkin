// ============================================================
// GET /api/automate/computers?clientName=Baumholtz+Plastic+Surgery
// GET /api/automate/computers?search=BPSHV
// GET /api/automate/computers?id=17
// ============================================================

import { auth } from '@/lib/auth/config'
import {
  getAutomateCredentials,
  isAutomateConfigured,
  getComputersByClient,
  getComputer,
  searchComputers,
} from '@/lib/automate/client'
import { cachedFetch } from '@/lib/cache/bff-cache'
import { deduplicatedFetch } from '@/lib/cache/dedup'
import { apiErrors, handleApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

const COMPUTER_LIST_TTL_MS = 30 * 1000 // 30 seconds

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    if (!isAutomateConfigured()) {
      return apiErrors.internal('Automate credentials not configured')
    }

    const { searchParams } = new URL(request.url)
    const clientName = searchParams.get('clientName')
    const search = searchParams.get('search')
    const id = searchParams.get('id')

    if (!clientName && !search && !id) {
      return apiErrors.badRequest('Provide clientName, search, or id parameter')
    }

    const creds = getAutomateCredentials()

    // Single computer by ID
    if (id) {
      const cacheKey = `automate:computer:${id}`
      const computer = await deduplicatedFetch(cacheKey, () =>
        cachedFetch(cacheKey, () => getComputer(creds, Number(id)), COMPUTER_LIST_TTL_MS)
      )
      return Response.json(computer)
    }

    // List by client name or search
    const filterKey = clientName ? `client:${clientName}` : `search:${search}`
    const cacheKey = `automate:computers:${filterKey}`

    const computers = await deduplicatedFetch(cacheKey, () =>
      cachedFetch(
        cacheKey,
        async () => {
          if (clientName) {
            return getComputersByClient(creds, clientName)
          }
          return searchComputers(creds, search!)
        },
        COMPUTER_LIST_TTL_MS
      )
    )

    return Response.json(computers)
  } catch (error) {
    return handleApiError(error)
  }
}
