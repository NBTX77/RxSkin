// ============================================================
// GET /api/meraki/licensing — License overview
// Query params: ?orgId=xxx (optional)
// ============================================================

import { auth } from '@/lib/auth/config'
import { getMerakiCredentials, isMerakiDemoMode } from '@/lib/meraki/credentials'
import { getLicenseOverview } from '@/lib/meraki/client'
import { getMockLicenseOverview } from '@/lib/meraki/mock-data'
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
      return Response.json({ ok: true, data: getMockLicenseOverview(), demo: true })
    }

    const creds = getMerakiCredentials()
    if (!creds) return Response.json({ ok: true, data: getMockLicenseOverview(), demo: true })

    const resolvedOrgId = orgId || '718324140565595403'

    const data = await cachedFetch(
      `meraki:licensing:${resolvedOrgId}`,
      () => getLicenseOverview(creds, resolvedOrgId),
      86400_000 // 24 hour cache
    )

    return Response.json({ ok: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}
