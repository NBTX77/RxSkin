// ============================================================
// /api/m365/tenants — Client Tenant CRUD for GDAP management
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import prisma from '@/lib/db/prisma'
import { resolveTenantId } from '@/lib/instrumentation/tenant-context'

export const dynamic = 'force-dynamic'

// ── GET — List all client tenants ────────────────────────────

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const tenantId = await resolveTenantId()

    const clientTenants = await prisma.clientTenant.findMany({
      where: { tenantId },
      orderBy: { displayName: 'asc' },
    })

    return Response.json(clientTenants)
  } catch (error) {
    return handleApiError(error)
  }
}

// ── POST — Create a new client tenant ────────────────────────

interface CreateBody {
  azureTenantId: string
  displayName: string
  domain?: string
  cwCompanyId?: number
  gdapRelationshipId?: string
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const body = (await request.json()) as Partial<CreateBody>

    if (!body.azureTenantId || !body.displayName) {
      return apiErrors.badRequest('azureTenantId and displayName are required')
    }

    const tenantId = await resolveTenantId()

    const created = await prisma.clientTenant.create({
      data: {
        tenantId,
        azureTenantId: body.azureTenantId,
        displayName: body.displayName,
        domain: body.domain ?? null,
        cwCompanyId: body.cwCompanyId ?? null,
        gdapRelationshipId: body.gdapRelationshipId ?? null,
      },
    })

    return Response.json(created, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

// ── PATCH — Update an existing client tenant ─────────────────

interface UpdateBody {
  id: string
  displayName?: string
  domain?: string
  cwCompanyId?: number
  gdapRelationshipId?: string
  gdapStatus?: string
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const body = (await request.json()) as Partial<UpdateBody>

    if (!body.id) {
      return apiErrors.badRequest('id is required')
    }

    const tenantId = await resolveTenantId()

    // Verify ownership
    const existing = await prisma.clientTenant.findFirst({
      where: { id: body.id, tenantId },
    })
    if (!existing) return apiErrors.notFound('Client tenant')

    const { id, ...updates } = body
    const updated = await prisma.clientTenant.update({
      where: { id },
      data: updates,
    })

    return Response.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

// ── DELETE — Soft-delete (set isActive = false) ──────────────

interface DeleteBody {
  id: string
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const body = (await request.json()) as Partial<DeleteBody>

    if (!body.id) {
      return apiErrors.badRequest('id is required')
    }

    const tenantId = await resolveTenantId()

    // Verify ownership
    const existing = await prisma.clientTenant.findFirst({
      where: { id: body.id, tenantId },
    })
    if (!existing) return apiErrors.notFound('Client tenant')

    await prisma.clientTenant.update({
      where: { id: body.id },
      data: { isActive: false },
    })

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
