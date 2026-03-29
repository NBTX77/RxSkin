// ============================================================
// POST /api/m365/mail/send — Send email (delegated auth)
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getUserGraphToken, OAuthTokenExpiredError } from '@/lib/graph/auth'
import { sendMail } from '@/lib/graph/mail'

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
    const { subject, body: emailBody, toRecipients, ccRecipients } = body

    if (!subject || !emailBody || !Array.isArray(toRecipients) || toRecipients.length === 0) {
      return apiErrors.badRequest('subject, body, and toRecipients[] are required')
    }

    const formatRecipients = (emails: string[]) =>
      emails.map((email: string) => ({ emailAddress: { address: email } }))

    await sendMail(token, {
      subject,
      body: { contentType: 'HTML', content: emailBody },
      toRecipients: formatRecipients(toRecipients),
      ccRecipients: ccRecipients?.length ? formatRecipients(ccRecipients) : undefined,
    })

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
