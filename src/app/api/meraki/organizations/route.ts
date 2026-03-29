// ============================================================
// GET /api/meraki/organizations — List all managed orgs
// ============================================================

import { auth } from '@/lib/auth/config'
import { getMerakiCredentials, isMerakiDemoMode } from '@/lib/meraki/credentials'
import { getOrganizations } from '@/lib/meraki/client'
import { getMockOrganizations } from '@/lib/meraki/mock-data'
import { cachedFetch } from '@/lib/cache/bff-cache'
import { apiErrors, handleApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const cookies = request.headers.get('cookie')

    if (isMerakiDemoMode(cookies)) {
      return Response.json({ ok: true, data: getMockOrganizations(), demo: true })
    }

    const creds = getMerakiCredentials()
    if (!creds) return Response.json({ ok: true, data: getMockOrganizations(), demo: true })

    const data = await cachedFetch(
      'meraki:organizations',
      () => getOrganizations(creds),
      3600_000 // 1 hour cache
    )

    return Response.json({ ok: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}
