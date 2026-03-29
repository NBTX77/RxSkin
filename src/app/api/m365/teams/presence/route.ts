// ============================================================
// POST /api/m365/teams/presence — Batch presence lookup (delegated auth)
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getUserGraphToken, OAuthTokenExpiredError } from '@/lib/graph/auth'
import { batchPresence } from '@/lib/graph/teams'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    let token: string
    try {
      token = await getUserGraphToken(session.user.id)
    } catch (err) {
      if (err instanceof OAuthTokenExpiredError) {
        return Response.json(
          { error: 'microsoft_not_connected', message: 'Connect your Microsoft account in Settings > Connections' },
          { status: 403 }
        )
      }
      throw err
    }

    const body = await request.json()
    const { userIds } = body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return apiErrors.badRequest('userIds must be a non-empty array of strings')
    }

    const results = await batchPresence(token, userIds)

    return Response.json({ presences: results })
  } catch (error) {
    return handleApiError(error)
  }
}
