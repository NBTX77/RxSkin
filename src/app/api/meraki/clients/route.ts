// ============================================================
// GET /api/meraki/clients — Network clients
// Query params: ?networkId=xxx (required for live, optional for demo)
// ============================================================

import { auth } from '@/lib/auth/config'
import { getMerakiCredentials, isMerakiDemoMode } from '@/lib/meraki/credentials'
import { getNetworkClients } from '@/lib/meraki/client'
import { getMockClients } from '@/lib/meraki/mock-data'
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
      return Response.json({ ok: true, data: getMockClients(networkId), demo: true })
    }

    const creds = getMerakiCredentials()
    if (!creds) return Response.json({ ok: true, data: getMockClients(networkId), demo: true })

    if (!networkId) return apiErrors.badRequest('networkId is required')

    const data = await cachedFetch(
      `meraki:clients:${networkId}`,
      () => getNetworkClients(creds, networkId),
      300_000 // 5 min cache
    )

    return Response.json({ ok: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}
