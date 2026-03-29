// ============================================================
// PATCH/DELETE /api/m365/calendar/[id] — Update or delete a calendar event
// Uses delegated auth (per-user OAuth2 token).
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getUserGraphToken, OAuthTokenExpiredError } from '@/lib/graph/auth'
import { updateEvent, deleteEvent } from '@/lib/graph/calendar'

export const dynamic = 'force-dynamic'

// ── PATCH — Update a calendar event ─────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    let token: string
    try {
      token = await getUserGraphToken(session.user.id!)
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

    await updateEvent(token, id, body)

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

// ── DELETE — Delete a calendar event ────────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    let token: string
    try {
      token = await getUserGraphToken(session.user.id!)
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

    await deleteEvent(token, id)

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
