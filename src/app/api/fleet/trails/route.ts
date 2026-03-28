// ============================================================
// GET /api/fleet/trails — Vehicle GPS breadcrumb trails (last 30 min)
// ============================================================

import { auth } from '@/lib/auth/config'
import { getVehicleLocationHistory, getSamsaraCredentials, isSamsaraConfigured } from '@/lib/samsara/client'
import { cachedFetch } from '@/lib/cache/bff-cache'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import type { FleetTrailsResponse } from '@/types/ops'

export const dynamic = 'force-dynamic'

const TRAIL_CACHE_TTL_MS = 10 * 1000 // 10 seconds — tight for real-time feel
const TRAIL_WINDOW_MS = 30 * 60 * 1000 // 30 minutes

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    if (!isSamsaraConfigured()) {
      return Response.json({
        ok: true,
        trails: [],
        windowStart: new Date().toISOString(),
        windowEnd: new Date().toISOString(),
      } satisfies FleetTrailsResponse)
    }

    const { tenantId } = session.user
    const cacheKey = `${tenantId}:fleet:trails`

    const data = await cachedFetch<FleetTrailsResponse>(
      cacheKey,
      async () => {
        const creds = getSamsaraCredentials()
        const now = new Date()
        const windowStart = new Date(now.getTime() - TRAIL_WINDOW_MS)

        const trails = await getVehicleLocationHistory(
          creds,
          windowStart.toISOString(),
          now.toISOString()
        )

        return {
          ok: true,
          trails: trails.map((t) => ({
            vehicleId: t.vehicleId,
            vehicleName: t.vehicleName,
            points: t.points.map((p) => ({
              lat: p.latitude,
              lng: p.longitude,
              speed: p.speedMph,
              heading: p.headingDegrees,
              time: p.time,
            })),
          })),
          windowStart: windowStart.toISOString(),
          windowEnd: now.toISOString(),
        }
      },
      TRAIL_CACHE_TTL_MS
    )

    return Response.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}
