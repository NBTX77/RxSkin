// ============================================================
// GET /api/m365/mail — List inbox messages (delegated auth)
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getUserGraphToken, OAuthTokenExpiredError } from '@/lib/graph/auth'
import { listInboxMessages } from '@/lib/graph/mail'

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
    const top = parseInt(searchParams.get('top') ?? '25', 10)
    const skipToken = searchParams.get('skipToken') ?? undefined
    const filter = searchParams.get('filter') ?? undefined

    const result = await listInboxMessages(token, { top, skipToken, filter })

    return Response.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
