// ============================================================
// GET/POST /api/m365/calendar — List and create M365 calendar events
// Uses delegated auth (per-user OAuth2 token).
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getUserGraphToken, OAuthTokenExpiredError } from '@/lib/graph/auth'
import { listEvents, createEvent } from '@/lib/graph/calendar'

export const dynamic = 'force-dynamic'

// ── GET — List calendar events with optional date range ─────
export async function GET(request: Request) {
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

    const url = new URL(request.url)
    const startDateTime = url.searchParams.get('startDateTime') || undefined
    const endDateTime = url.searchParams.get('endDateTime') || undefined
    const topParam = url.searchParams.get('top')
    const top = topParam ? parseInt(topParam, 10) : 50

    const result = await listEvents(token, { startDateTime, endDateTime, top })

    return Response.json({
      events: result.events,
      nextLink: result.nextLink,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// ── POST — Create a new calendar event ──────────────────────

interface CreateEventBody {
  subject: string
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
  location?: string
  attendees?: string[]
  isOnlineMeeting?: boolean
  body?: string
}

export async function POST(request: Request) {
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

    const rawBody: CreateEventBody = await request.json()

    if (!rawBody.subject || !rawBody.start || !rawBody.end) {
      return apiErrors.badRequest('subject, start, and end are required')
    }

    const eventData: Parameters<typeof createEvent>[1] = {
      subject: rawBody.subject,
      start: rawBody.start,
      end: rawBody.end,
      location: rawBody.location ? { displayName: rawBody.location } : undefined,
      attendees: rawBody.attendees?.map((email) => ({
        emailAddress: { address: email },
        type: 'required' as const,
      })),
      isOnlineMeeting: rawBody.isOnlineMeeting,
      body: rawBody.body ? { contentType: 'HTML', content: rawBody.body } : undefined,
    }

    const created = await createEvent(token, eventData)

    return Response.json(created, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
