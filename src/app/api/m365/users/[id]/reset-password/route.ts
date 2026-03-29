// ============================================================
// POST /api/m365/users/[id]/reset-password — Reset user password
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import prisma from '@/lib/db/prisma'
import { resolveTenantId } from '@/lib/instrumentation/tenant-context'
import { getGraphTokenForTenant } from '@/lib/graph/auth'
import { resetPassword } from '@/lib/graph/users'

export const dynamic = 'force-dynamic'

interface ResetPasswordBody {
  clientTenantId?: string
  newPassword?: string
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const tenantId = await resolveTenantId()
    const { id } = await params

    const body = (await request.json()) as ResetPasswordBody

    const token = await getGraphTokenForTenant(
      body.clientTenantId || process.env.AZURE_AD_TENANT_ID || ''
    )

    const tempPassword = await resetPassword(token, id, body.newPassword)

    // Audit log — never store the actual password
    await prisma.m365AuditAction.create({
      data: {
        tenantId,
        clientTenantId: body.clientTenantId || '',
        actorId: session.user.id || 'system',
        actorEmail: session.user.email || 'system@rxtech.app',
        action: 'password_reset',
        targetId: id,
        targetName: id,
      },
    })

    return Response.json({
      success: true,
      tempPassword,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
