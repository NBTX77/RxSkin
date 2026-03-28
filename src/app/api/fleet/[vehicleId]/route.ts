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

    // Try to pull from the cached fleet data
    let fleetData: FleetData | undefined
    try {
      fleetData = await cachedFetch<FleetData>(
        `${tenantId}:fleet:merged`,
        async () => {
          throw new Error('not cached')
        },
        30_000
      )
    } catch {
      // Not cached — tell client to call /api/fleet first
      return Response.json(
        { ok: false, error: 'Fleet data not loaded. Call /api/fleet first.' },
        { status: 404 }
      )
    }

    const tech = fleetData.techs.find(
      (t) => t.vehicleId === vehicleId || t.id === vehicleId
    )
    if (!tech) {
      return Response.json(
        { ok: false, error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    return Response.json({ ok: true, tech })
  } catch (error) {
    return handleApiError(error)
  }
}
