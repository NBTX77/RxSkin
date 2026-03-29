// ============================================================
// GET   /api/feedback/settings — Check if feedback is enabled
// PATCH /api/feedback/settings — Toggle feedback on/off (admin only)
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import prisma from '@/lib/db/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

/**
 * GET — Return current feedbackEnabled status.
 * Auth required.
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const settings = await prisma.tenantSettings.findFirst({
      where: { tenantId: session.user.tenantId },
      select: { feedbackEnabled: true },
    })

    return Response.json({
      feedbackEnabled: settings?.feedbackEnabled ?? false,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

const updateSettingsSchema = z.object({
  feedbackEnabled: z.boolean(),
})

/**
 * PATCH — Update feedbackEnabled setting.
 * Admin only.
 */
export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()
    if (session.user.role !== 'ADMIN') return apiErrors.forbidden()

    const body = await request.json()
    const parsed = updateSettingsSchema.safeParse(body)
    if (!parsed.success) {
      return apiErrors.badRequest(
        parsed.error.issues.map((i) => i.message).join(', ')
      )
    }

    const updated = await prisma.tenantSettings.upsert({
      where: { tenantId: session.user.tenantId },
      update: { feedbackEnabled: parsed.data.feedbackEnabled },
      create: {
        tenantId: session.user.tenantId,
        feedbackEnabled: parsed.data.feedbackEnabled,
      },
    })

    return Response.json({
      feedbackEnabled: updated.feedbackEnabled,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
