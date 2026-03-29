// ============================================================
// GET /api/meraki/devices — Device statuses across org(s)
// Query params: ?orgId=xxx (optional, defaults to first org)
// ============================================================

import { auth } from '@/lib/auth/config'
import { getMerakiCredentials, isMerakiDemoMode } from '@/lib/meraki/credentials'
import { getDeviceStatuses } from '@/lib/meraki/client'
import { getMockDeviceStatuses } from '@/lib/meraki/mock-data'
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
      return Response.json({ ok: true, data: getMockDeviceStatuses(orgId), demo: true })
    }

    const creds = getMerakiCredentials()
    if (!creds) return Response.json({ ok: true, data: getMockDeviceStatuses(orgId), demo: true })

    // Default to first org ID (Rx Technology)
    const resolvedOrgId = orgId || '718324140565595403'

    const data = await cachedFetch(
      `meraki:devices:${resolvedOrgId}`,
      () => getDeviceStatuses(creds, resolvedOrgId),
      300_000 // 5 min cache
    )

    return Response.json({ ok: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}
