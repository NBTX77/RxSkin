// ============================================================
// POST /api/m365/licenses/assign — Assign a license to a user
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import prisma from '@/lib/db/prisma'
import { resolveTenantId } from '@/lib/instrumentation/tenant-context'
import { getGraphTokenForTenant } from '@/lib/graph/auth'
import { assignLicense } from '@/lib/graph/licenses'

export const dynamic = 'force-dynamic'

interface AssignLicenseBody {
  clientTenantId?: string
  userId: string
  skuId: string
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const tenantId = await resolveTenantId()

    const body = (await request.json()) as AssignLicenseBody
    if (!body.userId || !body.skuId) {
      return apiErrors.badRequest('Missing required fields: userId, skuId')
    }

    const clientTenantId = body.clientTenantId || process.env.AZURE_AD_TENANT_ID || ''
    const token = await getGraphTokenForTenant(clientTenantId)

    await assignLicense(token, body.userId, body.skuId)

    await prisma.m365AuditAction.create({
      data: {
        tenantId,
        clientTenantId,
        actorId: session.user.id || 'system',
        actorEmail: session.user.email || 'system@rxtech.app',
        action: 'license_assign',
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
