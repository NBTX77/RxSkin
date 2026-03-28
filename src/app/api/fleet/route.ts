// ============================================================
// GET /api/fleet — Merged fleet data (Samsara + CW)
// ============================================================

import { auth } from '@/lib/auth/config'
import { getTenantCredentials } from '@/lib/auth/credentials'
import { getTickets, getScheduleEntries, getMembers } from '@/lib/cw/client'
import { getVehicleLocations, getDrivers, getHosClocks, getSamsaraCredentials, isSamsaraConfigured } from '@/lib/samsara/client'
import { mergeFleetData, getMockFleetData } from '@/lib/fleet/merge'
import { cachedFetch } from '@/lib/cache/bff-cache'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import type { FleetData } from '@/types/ops'

export const dynamic = 'force-dynamic'

const FLEET_CACHE_TTL_MS = 30 * 1000 // 30 seconds

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { tenantId } = session.user
    const cacheKey = `${tenantId}:fleet:merged`

    const data = await cachedFetch<FleetData>(
      cacheKey,
      async () => {
        // If Samsara isn't configured, return mock data
        if (!isSamsaraConfigured()) {
          console.log('[fleet] Samsara not configured — using mock data')
          const mock = getMockFleetData()
          return {
            ok: true,
            techs: mock.techs,
            schedHoldTickets: mock.schedHoldTickets,
            lastSync: new Date().toISOString(),
          }
        }

        // Try live Samsara + CW data, fall back to mock on error
        try {
          const cwCreds = await getTenantCredentials(tenantId)
          const samsaraCreds = getSamsaraCredentials()

          // Fetch all data sources in parallel
          const today = new Date()
          const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
          const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString()

          const [locations, drivers, hosClocks, members, tickets, scheduleEntries] = await Promise.all([
            getVehicleLocations(samsaraCreds),
            getDrivers(samsaraCreds),
            getHosClocks(samsaraCreds),
            getMembers(cwCreds),
            getTickets(cwCreds, {
              status: ['New', 'In Progress', 'Waiting Customer', 'Waiting Vendor', 'Schedule Hold', 'Scheduled'],
              pageSize: 200,
            }),
            getScheduleEntries(cwCreds, { start: startOfDay, end: endOfDay }),
          ])

          const merged = mergeFleetData({
            locations,
            drivers,
            hosClocks,
            members,
            tickets,
            scheduleEntries,
          })

          return {
            ok: true,
            techs: merged.techs,
            schedHoldTickets: merged.schedHoldTickets,
            lastSync: new Date().toISOString(),
          }
        } catch (samsaraError) {
          // Samsara or CW call failed — fall back to mock data
          console.error('[fleet] Samsara/CW fetch failed, falling back to mock:', samsaraError)
          const mock = getMockFleetData()
          return {
            ok: true,
            techs: mock.techs,
            schedHoldTickets: mock.schedHoldTickets,
            lastSync: new Date().toISOString(),
          }
        }
      },
      FLEET_CACHE_TTL_MS
    )

    return Response.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}
