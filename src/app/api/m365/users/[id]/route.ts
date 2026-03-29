// ============================================================
// GET/PATCH /api/m365/users/[id] — Get or update a single M365 user
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import prisma from '@/lib/db/prisma'
import { resolveTenantId } from '@/lib/instrumentation/tenant-context'
import { getGraphTokenForTenant } from '@/lib/graph/auth'
import { getUser, updateUser, listAuthMethods } from '@/lib/graph/users'

export const dynamic = 'force-dynamic'

// ── GET — Fetch user details + auth methods ─────────────────
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    await resolveTenantId()

    const { id } = await params
    const url = new URL(request.url)
    const clientTenantId = url.searchParams.get('clientTenantId')

    const token = await getGraphTokenForTenant(
      clientTenantId || process.env.AZURE_AD_TENANT_ID || ''
    )

    const [user, authMethods] = await Promise.all([
      getUser(token, id),
      listAuthMethods(token, id),
    ])

    return Response.json({ user, authMethods })
  } catch (error) {
    return handleApiError(error)
  }
}

// ── PATCH — Update user properties ──────────────────────────

interface UpdateUserBody {
  clientTenantId?: string
  accountEnabled?: boolean
  jobTitle?: string
  department?: string
  displayName?: string
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const tenantId = await resolveTenantId()
    const { id } = await params

    const body = (await request.json()) as UpdateUserBody
    const { clientTenantId, ...updates } = body

    // Must have at least one field to update
    if (Object.keys(updates).length === 0) {
      return apiErrors.badRequest('No update fields provided')
    }

    const token = await getGraphTokenForTenant(
      clientTenantId || process.env.AZURE_AD_TENANT_ID || ''
    )

    await updateUser(token, id, updates)

    // Determine action type — disabling a user is a distinct audit event
    const action =
      updates.accountEnabled === false ? 'user_disable' : 'user_update'

    // Audit log
    await prisma.m365AuditAction.create({
      data: {
        tenantId,
        clientTenantId: clientTenantId || '',
        actorId: session.user.id || 'system',
        actorEmail: session.user.email || 'system@rxtech.app',
        action,
        targetId: id,
        targetName: updates.displayName || id,
        details: JSON.parse(JSON.stringify(updates)),
      },
    })

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
