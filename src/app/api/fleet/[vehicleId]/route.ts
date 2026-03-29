// ============================================================
// GET /api/fleet/[vehicleId] — Single vehicle / tech detail
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { cachedFetch } from '@/lib/cache/bff-cache'
import type { FleetData } from '@/types/ops'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { vehicleId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { tenantId } = session.user
    const { vehicleId } = params

    // Pull from the cached fleet data and filter to the specific vehicle
    const cacheKey = `${tenantId}:fleet:merged`
    const fleetData = await cachedFetch<FleetData | null>(
      cacheKey,
      async () => null, // If not cached, return null — client should call /api/fleet first
      30_000
    )

    if (!fleetData) {
      return Response.json({ ok: false, error: 'Fleet data not loaded. Call /api/fleet first.' }, { status: 404 })
    }

    const tech = fleetData.techs.find((t) => t.vehicleId === vehicleId || t.id === vehicleId)
    if (!tech) {
      return Response.json({ ok: false, error: 'Vehicle not found' }, { status: 404 })
    }

    return Response.json({ ok: true, tech })
  } catch (error) {
    return handleApiError(error)
  }
}
