// ============================================================
// GET /api/samsara/drivers — Driver list
// ============================================================

import { auth } from '@/lib/auth/config'
import { getDrivers, getSamsaraCredentials, isSamsaraConfigured } from '@/lib/samsara/client'
import { cachedFetch } from '@/lib/cache/bff-cache'
import { apiErrors, handleApiError } from '@/lib/api/errors'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    if (!isSamsaraConfigured()) {
      return Response.json({ ok: false, error: 'Samsara not configured' }, { status: 503 })
    }

    const creds = getSamsaraCredentials()
    const cacheKey = 'samsara:drivers'

    const data = await cachedFetch(
      cacheKey,
      async () => {
        const drivers = await getDrivers(creds)
        return { ok: true, drivers }
      },
      60_000
    )

    return Response.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}