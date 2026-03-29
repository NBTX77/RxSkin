// ============================================================
// POST /api/m365/licenses/remove — Remove a license from a user
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import prisma from '@/lib/db/prisma'
import { resolveTenantId } from '@/lib/instrumentation/tenant-context'
import { getGraphTokenForTenant } from '@/lib/graph/auth'
import { removeLicense } from '@/lib/graph/licenses'

export const dynamic = 'force-dynamic'

interface RemoveLicenseBody {
  clientTenantId?: string
  userId: string
  skuId: string
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const tenantId = await resolveTenantId()

    const body = (await request.json()) as RemoveLicenseBody
    if (!body.userId || !body.skuId) {
      return apiErrors.badRequest('Missing required fields: userId, skuId')
    }

    const clientTenantId = body.clientTenantId || process.env.AZURE_AD_TENANT_ID || ''
    const token = await getGraphTokenForTenant(clientTenantId)

    await removeLicense(token, body.userId, body.skuId)

    await prisma.m365AuditAction.create({
      data: {
        tenantId,
        clientTenantId,
        actorId: session.user.id || 'system',
        actorEmail: session.user.email || 'system@rxtech.app',
        action: 'license_remove',
        targetId: body.userId,
        targetName: body.userId,
        details: { skuId: body.skuId },
      },
    })

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
