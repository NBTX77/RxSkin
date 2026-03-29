// ============================================================
// GET/PATCH/DELETE /api/m365/mail/[id] — Single message ops (delegated auth)
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getUserGraphToken, OAuthTokenExpiredError } from '@/lib/graph/auth'
import { getMessage, markAsRead, deleteMessage } from '@/lib/graph/mail'

export const dynamic = 'force-dynamic'

async function getDelegatedToken(userId: string): Promise<string | Response> {
  try {
    return await getUserGraphToken(userId)
  } catch (err) {
    if (err instanceof OAuthTokenExpiredError) {
      return Response.json(
        { error: 'microsoft_not_connected', message: 'Connect your Microsoft account in Settings > Connections' },
        { status: 403 }
      )
    }
    throw err
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const tokenOrResponse = await getDelegatedToken(session.user.id)
    if (tokenOrResponse instanceof Response) return tokenOrResponse

    const { id } = await params
    const message = await getMessage(tokenOrResponse, id)

    return Response.json(message)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const tokenOrResponse = await getDelegatedToken(session.user.id)
    if (tokenOrResponse instanceof Response) return tokenOrResponse

    const { id } = await params
    const body = await request.json()

    if (typeof body.isRead !== 'boolean') {
      return apiErrors.badRequest('isRead (boolean) is required')
    }

    await markAsRead(tokenOrResponse, id, body.isRead)

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const tokenOrResponse = await getDelegatedToken(session.user.id)
    if (tokenOrResponse instanceof Response) return tokenOrResponse

    const { id } = await params
    await deleteMessage(tokenOrResponse, id)

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
