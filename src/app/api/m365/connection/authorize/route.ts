// ============================================================
// GET /api/m365/connection/authorize — Generate Microsoft auth URL
// Returns the OAuth2 authorization URL for the current user
// to initiate the Microsoft 365 connection flow.
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

const MICROSOFT_SCOPES =
  'openid profile email offline_access Mail.Read Mail.Send Calendars.ReadWrite Chat.ReadWrite Presence.Read.All'

const AUTHORIZE_ENDPOINT = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const userId = session.user.id
    if (!userId) return apiErrors.unauthorized()

    const clientId = process.env.AZURE_AD_CLIENT_ID
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    if (!clientId) {
      return apiErrors.internal('Microsoft OAuth is not configured (missing AZURE_AD_CLIENT_ID)')
    }

    const redirectUri = `${baseUrl}/api/auth/callback/microsoft`

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: MICROSOFT_SCOPES,
      response_mode: 'query',
      state: userId,
    })

    const url = `${AUTHORIZE_ENDPOINT}?${params.toString()}`

    return Response.json({ url })
  } catch (error) {
    return handleApiError(error)
  }
}
