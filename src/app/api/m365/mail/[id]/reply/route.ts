// ============================================================
// POST /api/m365/mail/[id]/reply — Reply to message (delegated auth)
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getUserGraphToken, OAuthTokenExpiredError } from '@/lib/graph/auth'
import { replyToMessage } from '@/lib/graph/mail'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()

    if (!body.comment || typeof body.comment !== 'string') {
      return apiErrors.badRequest('comment (string) is required')
    }

    await replyToMessage(token, id, body.comment)

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
