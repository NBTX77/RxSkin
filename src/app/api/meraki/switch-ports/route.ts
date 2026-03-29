// GET /api/meraki/switch-ports — Switch port statuses for a device
// Query params: ?serial=Q2XX-XXXX-XXXX (required)

import { auth } from '@/lib/auth/config'
import { getMerakiCredentials, isMerakiDemoMode } from '@/lib/meraki/credentials'
import { getSwitchPortStatuses } from '@/lib/meraki/client'
import { getMockSwitchPortStatuses } from '@/lib/meraki/mock-data'
import { cachedFetch } from '@/lib/cache/bff-cache'
import { apiErrors, handleApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { searchParams } = new URL(request.url)
    const serial = searchParams.get('serial')
    if (!serial) return apiErrors.badRequest('serial is required')

    const cookies = request.headers.get('cookie')

    if (isMerakiDemoMode(cookies)) {
      return Response.json({ ok: true, data: getMockSwitchPortStatuses(serial), demo: true })
    }

    const creds = getMerakiCredentials()
    if (!creds) return Response.json({ ok: true, data: getMockSwitchPortStatuses(serial), demo: true })

    const data = await cachedFetch(
      `meraki:switch-ports:${serial}`,
      () => getSwitchPortStatuses(creds, serial),
      300_000 // 5 min
    )

    return Response.json({ ok: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}
