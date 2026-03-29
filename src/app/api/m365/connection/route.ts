// ============================================================
// GET/DELETE /api/m365/connection — Check or disconnect M365
// GET: Returns connection status for current user
// DELETE: Removes the Microsoft OAuth token for current user
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import prisma from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

// ── GET — Check if current user has a Microsoft OAuth token ──
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const userId = session.user.id
    if (!userId) return apiErrors.unauthorized()

    const token = await prisma.userOAuthToken.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: 'microsoft',
        },
      },
      select: {
        expiresAt: true,
        scopes: true,
      },
    })

    if (!token) {
      return Response.json({ connected: false })
    }

    return Response.json({
      connected: true,
      expiresAt: token.expiresAt.toISOString(),
      scopes: token.scopes,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// ── DELETE — Disconnect Microsoft OAuth token ────────────────
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const userId = session.user.id
    if (!userId) return apiErrors.unauthorized()

    await prisma.userOAuthToken.deleteMany({
      where: {
        userId,
        provider: 'microsoft',
      },
    })

    return Response.json({ disconnected: true })
  } catch (error) {
    return handleApiError(error)
  }
}
