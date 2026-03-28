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

        // Fetch live Samsara + CW data with graceful per-source fallback
        const cwCreds = await getTenantCredentials(tenantId)
        const samsaraCreds = getSamsaraCredentials()

        const today = new Date()
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString()

        // Wrap each source so one failure doesn't kill the whole response
        const [locations, drivers, hosClocks, members, tickets, scheduleEntries] = await Promise.all([
          getVehicleLocations(samsaraCreds).catch((e) => {
            console.error('[fleet] Samsara locations failed:', e.message ?? e)
            return [] as Awaited<ReturnType<typeof getVehicleLocations>>
          }),
          getDrivers(samsaraCreds).catch((e) => {
            console.error('[fleet] Samsara drivers failed:', e.message ?? e)
            return [] as Awaited<ReturnType<typeof getDrivers>>
          }),
          getHosClocks(samsaraCreds).catch((e) => {
            console.error('[fleet] Samsara HOS failed:', e.message ?? e)
            return [] as Awaited<ReturnType<typeof getHosClocks>>
          }),
          getMembers(cwCreds).catch((e) => {
            console.error('[fleet] CW members failed:', e.message ?? e)
            return [] as Awaited<ReturnType<typeof getMembers>>
          }),
          getTickets(cwCreds, {
            status: ['New', 'In Progress', 'Waiting Customer', 'Waiting Vendor', 'Schedule Hold', 'Scheduled'],
            pageSize: 200,
          }).catch((e) => {
            console.error('[fleet] CW tickets failed:', e.message ?? e)
            return [] as Awaited<ReturnType<typeof getTickets>>
          }),
          getScheduleEntries(cwCreds, { start: startOfDay, end: endOfDay }).catch((e) => {
            console.error('[fleet] CW schedule failed:', e.message ?? e)
            return [] as Awaited<ReturnType<typeof getScheduleEntries>>
          }),
        ])

        // Debug: log what each source returned
        console.log(`[fleet] Data: ${drivers.length} drivers, ${locations.length} locations, ${hosClocks.length} HOS, ${members.length} members, ${tickets.length} tickets, ${scheduleEntries.length} schedEntries`)
        if (drivers.length > 0) {
          console.log(`[fleet] Sample driver: ${JSON.stringify({ name: drivers[0].name, vehicleId: drivers[0].vehicleId, vehicleName: drivers[0].vehicleName })}`)
        }
        if (locations.length > 0) {
          console.log(`[fleet] Sample location: ${JSON.stringify({ id: locations[0].id, name: locations[0].name, lat: locations[0].latitude, lng: locations[0].longitude })}`)
        }

        // If we got zero drivers AND zero locations, nothing to merge — fall back to mock
        if (drivers.length === 0 && locations.length === 0) {
          console.warn('[fleet] No Samsara data returned — falling back to mock')
          const mock = getMockFleetData()
          return {
            ok: true,
            techs: mock.techs,
            schedHoldTickets: mock.schedHoldTickets,
            lastSync: new Date().toISOString(),
          }
        }

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
      },
      FLEET_CACHE_TTL_MS
    )

    return Response.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}
