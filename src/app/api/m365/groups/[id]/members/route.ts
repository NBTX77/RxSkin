// ============================================================
// GET/POST/DELETE /api/m365/groups/[id]/members — Manage group membership
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import prisma from '@/lib/db/prisma'
import { resolveTenantId } from '@/lib/instrumentation/tenant-context'
import { getGraphTokenForTenant } from '@/lib/graph/auth'
import {
  listGroupMembers,
  addGroupMember,
  removeGroupMember,
} from '@/lib/graph/groups'

export const dynamic = 'force-dynamic'

// ── GET — List group members ────────────────────────────────
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

    const members = await listGroupMembers(token, id)
    return Response.json({ members })
  } catch (error) {
    return handleApiError(error)
  }
}

// ── POST — Add a user to the group ──────────────────────────

interface AddMemberBody {
  clientTenantId?: string
  userId: string
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

    const body = (await request.json()) as AddMemberBody
    if (!body.userId) {
      return apiErrors.badRequest('Missing required field: userId')
    }

    const token = await getGraphTokenForTenant(
      body.clientTenantId || process.env.AZURE_AD_TENANT_ID || ''
    )

    await addGroupMember(token, id, body.userId)

    // Audit log
    await prisma.m365AuditAction.create({
      data: {
        tenantId,
        clientTenantId: body.clientTenantId || '',
        actorId: session.user.id || 'system',
        actorEmail: session.user.email || 'system@rxtech.app',
        action: 'group_add',
        targetId: body.userId,
        targetName: body.userId,
        details: { groupId: id },
      },
    })

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

// ── DELETE — Remove a user from the group ───────────────────
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const tenantId = await resolveTenantId()
    const { id } = await params

    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const clientTenantId = url.searchParams.get('clientTenantId')

    if (!userId) {
      return apiErrors.badRequest('Missing required query parameter: userId')
    }

    const token = await getGraphTokenForTenant(
      clientTenantId || process.env.AZURE_AD_TENANT_ID || ''
    )

    await removeGroupMember(token, id, userId)

    // Audit log
    await prisma.m365AuditAction.create({
      data: {
        tenantId,
        clientTenantId: clientTenantId || '',
        actorId: session.user.id || 'system',
        actorEmail: session.user.email || 'system@rxtech.app',
        action: 'group_remove',
        targetId: userId,
        targetName: userId,
        details: { groupId: id },
      },
    })

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
