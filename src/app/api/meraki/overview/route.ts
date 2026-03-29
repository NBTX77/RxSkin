// ============================================================
// GET /api/meraki/overview — Aggregated dashboard overview
// Returns org count, device health, network count, client count.
// ============================================================

import { auth } from '@/lib/auth/config'
import { getMerakiCredentials, isMerakiDemoMode } from '@/lib/meraki/credentials'
import { getOrganizations, getDeviceStatuses } from '@/lib/meraki/client'
import { getMockDashboardOverview } from '@/lib/meraki/mock-data'
import { cachedFetch } from '@/lib/cache/bff-cache'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import type { MerakiDashboardOverview } from '@/types/meraki'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const cookies = request.headers.get('cookie')

    if (isMerakiDemoMode(cookies)) {
      return Response.json({ ok: true, data: getMockDashboardOverview(), demo: true })
    }

    const creds = getMerakiCredentials()
    if (!creds) return Response.json({ ok: true, data: getMockDashboardOverview(), demo: true })

    const data = await cachedFetch<MerakiDashboardOverview>(
      'meraki:overview',
      async () => {
        const orgs = await getOrganizations(creds)

        // Get device statuses for first org (primary)
        const primaryOrgId = orgs[0]?.id || '718324140565595403'
        const devices = await getDeviceStatuses(creds, primaryOrgId)

        return {
          organizations: orgs,
          totalDevices: devices.length,
          onlineDevices: devices.filter(d => d.status === 'online').length,
          alertingDevices: devices.filter(d => d.status === 'alerting').length,
          offlineDevices: devices.filter(d => d.status === 'offline').length,
          totalNetworks: 0, // populated by networks route
          totalClients: 0,  // populated by clients route
        }
      },
      300_000 // 5 min cache
    )

    return Response.json({ ok: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}
