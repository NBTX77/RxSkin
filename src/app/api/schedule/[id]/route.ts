// ============================================================
// PATCH /api/schedule/[id] — Update (reschedule) an entry
// DELETE /api/schedule/[id] — Remove a schedule entry
// ============================================================

import { auth } from '@/lib/auth/config'
import { getTenantCredentials } from '@/lib/auth/credentials'
import { updateScheduleEntry, deleteScheduleEntry } from '@/lib/cw/client'
import { invalidateCache } from '@/lib/cache/bff-cache'
import { apiErrors, handleApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

/**
 * PATCH — Reschedule an entry (change dateStart/dateEnd).
 * Used by drag-and-drop and event resize.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const entryId = Number(params.id)
    if (!entryId || isNaN(entryId)) {
      return Response.json({ error: 'Invalid entry ID' }, { status: 400 })
    }

    const body = await request.json()
    const patches: Record<string, unknown>[] = []

    if (body.dateStart) {
      patches.push({ op: 'replace', path: '/dateStart', value: body.dateStart })
    }
    if (body.dateEnd) {
      patches.push({ op: 'replace', path: '/dateEnd', value: body.dateEnd })
    }

    if (patches.length === 0) {
      return Response.json({ error: 'No updates provided' }, { status: 400 })
    }

    const { tenantId } = session.user
    const creds = await getTenantCredentials(tenantId)

    const updated = await updateScheduleEntry(creds, entryId, patches)

    // Invalidate schedule cache
    invalidateCache(`${tenantId}:schedule`)

    return Response.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE — Remove a schedule entry.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const entryId = Number(params.id)
    if (!entryId || isNaN(entryId)) {
      return Response.json({ error: 'Invalid entry ID' }, { status: 400 })
    }

    const { tenantId } = session.user
    const creds = await getTenantCredentials(tenantId)

    await deleteScheduleEntry(creds, entryId)

    // Invalidate schedule cache
    invalidateCache(`${tenantId}:schedule`)

    return Response.json({ ok: true, deleted: entryId })
  } catch (error) {
    return handleApiError(error)
  }
}
