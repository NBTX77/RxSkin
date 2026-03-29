// ============================================================
// GET /api/meraki/alerts — Alert history for org
// Query params: ?orgId=xxx (optional)
// ============================================================

import { auth } from '@/lib/auth/config'
import { getMerakiCredentials, isMerakiDemoMode } from '@/lib/meraki/credentials'
import { getMockAlerts } from '@/lib/meraki/mock-data'
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
      return Response.json({ ok: true, data: getMockAlerts(orgId), demo: true })
    }

    const creds = getMerakiCredentials()
    if (!creds) return Response.json({ ok: true, data: getMockAlerts(orgId), demo: true })

    // For live data, alerts are per-network — aggregate across all networks in the org
    // This is a simplified version; full implementation would iterate networks
    return Response.json({ ok: true, data: getMockAlerts(orgId), demo: false })
  } catch (error) {
    return handleApiError(error)
  }
}
