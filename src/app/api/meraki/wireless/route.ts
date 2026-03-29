// ============================================================
// GET /api/meraki/wireless — SSIDs for a network
// Query params: ?networkId=xxx (required for live)
// ============================================================

import { auth } from '@/lib/auth/config'
import { getMerakiCredentials, isMerakiDemoMode } from '@/lib/meraki/credentials'
import { getSSIDs } from '@/lib/meraki/client'
import { getMockSSIDs } from '@/lib/meraki/mock-data'
import { cachedFetch } from '@/lib/cache/bff-cache'
import { apiErrors, handleApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { searchParams } = new URL(request.url)
    const networkId = searchParams.get('networkId') || undefined
    const cookies = request.headers.get('cookie')

    if (isMerakiDemoMode(cookies)) {
      return Response.json({ ok: true, data: getMockSSIDs(), demo: true })
    }

    const creds = getMerakiCredentials()
    if (!creds) return Response.json({ ok: true, data: getMockSSIDs(), demo: true })

    if (!networkId) return apiErrors.badRequest('networkId is required')

    const data = await cachedFetch(
      `meraki:ssids:${networkId}`,
      () => getSSIDs(creds, networkId),
      600_000 // 10 min cache
    )

    return Response.json({ ok: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}
