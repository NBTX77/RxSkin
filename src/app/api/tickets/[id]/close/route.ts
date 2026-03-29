// ============================================================
// POST /api/tickets/[id]/close — Batch close a ticket
// Orchestrates: status update + time entry + resolution note + client notification
// ============================================================

import { auth } from '@/lib/auth/config'
import { getTenantCredentials } from '@/lib/auth/credentials'
import { updateTicket, addTicketNote, createTimeEntry } from '@/lib/cw/client'
import { invalidateCacheKey, invalidateCache } from '@/lib/cache/bff-cache'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

function isCWConfigured(): boolean {
  return !!(process.env.CW_BASE_URL && process.env.CW_PUBLIC_KEY && process.env.CW_PRIVATE_KEY)
}

const closeTicketSchema = z.object({
  resolutionNote: z.string().min(1, 'Resolution note is required').max(10000),
  timeEntry: z.object({
    hours: z.number().min(0).max(24),
    minutes: z.number().min(0).max(59).optional().default(0),
    workType: z.string().optional(),
    notes: z.string().max(5000).optional(),
  }).optional(),
  notifyClient: z.boolean().optional().default(false),
  notificationMessage: z.string().max(10000).optional(),
})

export type CloseTicketRequest = z.infer<typeof closeTicketSchema>

export interface CloseTicketResponse {
  success: boolean
  ticketId: number
  actions: {
    statusUpdated: boolean
    noteAdded: boolean
    timeEntryCreated: boolean
    clientNotified: boolean
  }
  errors: string[]
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()
    if (session.user.role === 'VIEWER') return apiErrors.forbidden()

    const ticketId = parseInt(params.id, 10)
    if (isNaN(ticketId)) return apiErrors.badRequest('Invalid ticket ID')

    if (!isCWConfigured()) {
      return Response.json(
        { code: 'SERVICE_UNAVAILABLE', message: 'ConnectWise API not configured', retryable: false },
        { status: 503 }
      )
    }

    const body = await request.json()
    const parsed = closeTicketSchema.safeParse(body)
    if (!parsed.success) {
      return apiErrors.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body')
    }

    const { tenantId } = session.user
    const creds = await getTenantCredentials(tenantId)
    const data = parsed.data

    const result: CloseTicketResponse = {
      success: false,
      ticketId,
      actions: {
        statusUpdated: false,
        noteAdded: false,
        timeEntryCreated: false,
        clientNotified: false,
      },
      errors: [],
    }

    // 1. Update ticket status to "Closed" via JSON Patch
    try {
      await updateTicket(creds, ticketId, [
        { op: 'replace', path: '/status', value: { name: '>Closed' } },
      ])
      result.actions.statusUpdated = true
    } catch {
      // CW may not accept ">Closed" — fallback to "Closed"
      try {
        await updateTicket(creds, ticketId, [
          { op: 'replace', path: '/status', value: { name: 'Closed' } },
        ])
        result.actions.statusUpdated = true
      } catch (innerErr) {
        const msg = innerErr instanceof Error ? innerErr.message : 'Failed to update status'
        result.errors.push(`Status update failed: ${msg}`)
      }
    }

    // 2. Create time entry if hours > 0
    if (data.timeEntry) {
      const totalHours = data.timeEntry.hours + (data.timeEntry.minutes ?? 0) / 60
      if (totalHours > 0) {
        try {
          await createTimeEntry(creds, {
            ticketId,
            actualHours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
            notes: data.timeEntry.notes ?? data.resolutionNote,
          })
          result.actions.timeEntryCreated = true
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Failed to create time entry'
          result.errors.push(`Time entry failed: ${msg}`)
        }
      }
    }

    // 3. Add internal resolution note
    try {
      await addTicketNote(creds, ticketId, data.resolutionNote, true)
      result.actions.noteAdded = true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add note'
      result.errors.push(`Resolution note failed: ${msg}`)
    }

    // 4. If notifyClient is true, create an external note so CW sends the notification
    if (data.notifyClient) {
      const notificationText = data.notificationMessage?.trim() || data.resolutionNote
      try {
        await addTicketNote(creds, ticketId, notificationText, false)
        result.actions.clientNotified = true
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to send client notification'
        result.errors.push(`Client notification failed: ${msg}`)
      }
    }

    // Bust all related caches
    invalidateCacheKey(`${tenantId}:tickets:detail:${ticketId}`)
    invalidateCacheKey(`${tenantId}:tickets:${ticketId}:notes`)
    invalidateCacheKey(`${tenantId}:tickets:${ticketId}:time-entries`)
    invalidateCache(`${tenantId}:tickets:list:`)

    // Consider it a success if at least the status was updated
    result.success = result.actions.statusUpdated

    return Response.json(result, { status: result.success ? 200 : 207 })
  } catch (error) {
    return handleApiError(error)
  }
}
