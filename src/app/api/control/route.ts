// ============================================================
// GET /api/control?computerName=BPSHV01 — Find ScreenConnect session + launch URL
// ============================================================

import { auth } from '@/lib/auth/config'
import { getControlCredentials, isControlConfigured, findSessionByComputerName, buildLaunchUrl } from '@/lib/control/client'
import { cachedFetch } from '@/lib/cache/bff-cache'
import { deduplicatedFetch } from '@/lib/cache/dedup'
import { apiErrors, handleApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

const SESSION_TTL_MS = 30 * 1000 // 30 seconds

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    if (!isControlConfigured()) {
      return apiErrors.internal('ScreenConnect credentials not configured')
    }

    const { searchParams } = new URL(request.url)
    const computerName = searchParams.get('computerName')

    if (!computerName) {
      return apiErrors.badRequest('computerName parameter is required')
    }

    const cacheKey = `control:session:${computerName.toLowerCase()}`

    const result = await deduplicatedFetch(cacheKey, () =>
      cachedFetch(
        cacheKey,
        async () => {
          const creds = getControlCredentials()
          const scSession = await findSessionByComputerName(creds, computerName)

          if (!scSession) {
            return { found: false, computerName, session: null, launchUrl: null }
          }

          return {
            found: true,
            computerName,
            session: scSession,
            launchUrl: buildLaunchUrl(creds.baseUrl, scSession.sessionId),
          }
        },
        SESSION_TTL_MS
      )
    )

    return Response.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}