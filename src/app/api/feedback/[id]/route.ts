// ============================================================
// PATCH /api/feedback/[id] — Update feedback status (admin only)
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import prisma from '@/lib/db/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateFeedbackSchema = z.object({
  adminStatus: z
    .enum(['unreviewed', 'acknowledged', 'in-progress', 'resolved', 'dismissed'])
    .optional(),
  adminNotes: z.string().max(5000).optional(),
  linkedTaskUrl: z.string().url().max(2048).optional().nullable(),
})

/**
 * PATCH — Update feedback admin status, notes, or linked task.
 * Admin only. Sets reviewedBy and reviewedAt automatically.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()
    if (session.user.role !== 'ADMIN') return apiErrors.forbidden()

    const { id } = await params

    // Verify the feedback exists and belongs to this tenant
    const existing = await prisma.userFeedback.findFirst({
      where: { id, tenantId: session.user.tenantId },
      select: { id: true },
    })

    if (!existing) {
      return apiErrors.notFound('Feedback')
    }

    const body = await request.json()
    const parsed = updateFeedbackSchema.safeParse(body)
    if (!parsed.success) {
      return apiErrors.badRequest(
        parsed.error.issues.map((i) => i.message).join(', ')
      )
    }

    // Build update data — only include fields that were provided
    const updateData: Record<string, unknown> = {
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    }

    if (parsed.data.adminStatus !== undefined) {
      updateData.adminStatus = parsed.data.adminStatus
    }
    if (parsed.data.adminNotes !== undefined) {
      updateData.adminNotes = parsed.data.adminNotes
    }
    if (parsed.data.linkedTaskUrl !== undefined) {
      updateData.linkedTaskUrl = parsed.data.linkedTaskUrl
    }

    const updated = await prisma.userFeedback.update({
      where: { id },
      data: updateData,
    })

    return Response.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
