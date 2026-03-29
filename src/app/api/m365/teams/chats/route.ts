// ============================================================
// GET /api/m365/teams/chats — List Teams chats (delegated auth)
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getUserGraphToken, OAuthTokenExpiredError } from '@/lib/graph/auth'
import { listChats } from '@/lib/graph/teams'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const top = parseInt(searchParams.get('top') ?? '20', 10)

    const result = await listChats(token, { top })

    return Response.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
