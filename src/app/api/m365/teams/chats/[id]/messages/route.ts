// ============================================================
// GET + POST /api/m365/teams/chats/[id]/messages — Chat messages (delegated auth)
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getUserGraphToken, OAuthTokenExpiredError } from '@/lib/graph/auth'
import { getChatMessages, sendChatMessage } from '@/lib/graph/teams'

export const dynamic = 'force-dynamic'

export async function GET(
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
    const { searchParams } = new URL(request.url)
    const top = parseInt(searchParams.get('top') ?? '50', 10)

    const result = await getChatMessages(token, id, { top })

    return Response.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}

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
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return apiErrors.badRequest('content is required and must be a non-empty string')
    }

    const message = await sendChatMessage(token, id, content.trim())

    return Response.json(message)
  } catch (error) {
    return handleApiError(error)
  }
}
