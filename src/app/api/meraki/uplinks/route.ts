// ============================================================
// GET /api/meraki/uplinks — WAN uplink statuses
// Query params: ?orgId=xxx (optional)
// ============================================================

import { auth } from '@/lib/auth/config'
import { getMerakiCredentials, isMerakiDemoMode } from '@/lib/meraki/credentials'
import { getUplinkStatuses } from '@/lib/meraki/client'
import { getMockUplinkStatuses } from '@/lib/meraki/mock-data'
import { cachedFetch } from '@/lib/cache/bff-cache'
import { apiErrors, handleApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId') || undefined
    const cookies = request.headers.get('cookie')

    if (isMerakiDemoMode(cookies)) {
      return Response.json({ ok: true, data: getMockUplinkStatuses(orgId), demo: true })
    }

    const creds = getMerakiCredentials()
    if (!creds) return Response.json({ ok: true, data: getMockUplinkStatuses(orgId), demo: true })

    const resolvedOrgId = orgId || '718324140565595403'

    const data = await cachedFetch(
      `meraki:uplinks:${resolvedOrgId}`,
      () => getUplinkStatuses(creds, resolvedOrgId),
      300_000 // 5 min cache
    )

    return Response.json({ ok: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}
