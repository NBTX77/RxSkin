// ============================================================
// GET /api/samsara/vehicles — Vehicle list + locations
// ============================================================

import { auth } from '@/lib/auth/config'
import { getVehicles, getVehicleLocations, getSamsaraCredentials, isSamsaraConfigured } from '@/lib/samsara/client'
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
    const cacheKey = 'samsara:vehicles'

    const data = await cachedFetch(
      cacheKey,
      async () => {
        const [vehicles, locations] = await Promise.all([
          getVehicles(creds),
          getVehicleLocations(creds),
        ])
        return { ok: true, vehicles, locations }
      },
      30_000
    )

    return Response.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}