// GET/POST /api/tickets/[id]/notes — List or add notes for a ticket

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getCWCredentials } from '@/lib/cw/credentials'
import { getTicketNotes, addTicketNote } from '@/lib/cw/client'
import { getMockNotes } from '@/lib/mock-data'
import type { TicketNote } from '@/types'

function normalizeNote(raw: Record<string, unknown>, ticketId: number): TicketNote {
  return {
    id: typeof raw.id === 'number' ? raw.id : 0,
    ticketId,
    text: String(raw.text ?? ''),
    isInternal: Boolean(raw.internalAnalysisFlag),
    createdBy: raw.member && typeof raw.member === 'object'
      ? String((raw.member as Record<string, unknown>).name ?? '')
      : String(raw.createdBy ?? ''),
    createdAt: String(raw._info && typeof raw._info === 'object'
      ? (raw._info as Record<string, unknown>).lastUpdated ?? ''
      : raw.dateCreated ?? ''),
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const ticketId = parseInt(params.id, 10)
    if (isNaN(ticketId)) return apiErrors.badRequest('Invalid ticket ID')

    const creds = getCWCredentials()
    if (creds) {
      const raw = await getTicketNotes(creds, ticketId)
      const notes = raw.map(r => normalizeNote(r, ticketId))
      return Response.json(notes)
    } else {
      const notes = getMockNotes(ticketId)
      return Response.json(notes)
    }
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const ticketId = parseInt(params.id, 10)
    if (isNaN(ticketId)) return apiErrors.badRequest('Invalid ticket ID')

    const body = await request.json()
    const { text, isInternal } = body as { text?: string; isInternal?: boolean }
    if (!text?.trim()) return apiErrors.badRequest('Note text is required')

    const creds = getCWCredentials()
    if (!creds) return apiErrors.internal('ConnectWise credentials not configured')

    const raw = await addTicketNote(creds, ticketId, text.trim(), isInternal ?? false)
    const note = normalizeNote(raw, ticketId)
    return Response.json(note, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
