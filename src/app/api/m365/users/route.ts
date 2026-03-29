// ============================================================
// GET/POST /api/m365/users — List and create M365 users
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import prisma from '@/lib/db/prisma'
import { resolveTenantId } from '@/lib/instrumentation/tenant-context'
import { getGraphTokenForTenant } from '@/lib/graph/auth'
import { listUsers, createUser } from '@/lib/graph/users'

export const dynamic = 'force-dynamic'

// ── GET — List users with pagination, filter, search ────────
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    await resolveTenantId()

    const url = new URL(request.url)
    const clientTenantId = url.searchParams.get('clientTenantId')
    const top = url.searchParams.get('top')
    const filter = url.searchParams.get('filter')
    const search = url.searchParams.get('search')
    const skipToken = url.searchParams.get('skipToken')

    const token = await getGraphTokenForTenant(
      clientTenantId || process.env.AZURE_AD_TENANT_ID || ''
    )

    const result = await listUsers(token, {
      top: top ? parseInt(top, 10) : undefined,
      filter: filter || undefined,
      search: search || undefined,
      skipToken: skipToken || undefined,
    })

    return Response.json({
      users: result.users,
      nextLink: result.nextLink,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// ── POST — Create a new user ────────────────────────────────

interface CreateUserBody {
  clientTenantId?: string
  displayName: string
  userPrincipalName: string
  mailNickname: string
  password: string
  forceChangePassword?: boolean
  jobTitle?: string
  department?: string
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const tenantId = await resolveTenantId()

    const body = (await request.json()) as CreateUserBody
    if (!body.displayName || !body.userPrincipalName || !body.mailNickname || !body.password) {
      return apiErrors.badRequest(
        'Missing required fields: displayName, userPrincipalName, mailNickname, password'
      )
    }

    const token = await getGraphTokenForTenant(
      body.clientTenantId || process.env.AZURE_AD_TENANT_ID || ''
    )

    const result = await createUser(token, {
      displayName: body.displayName,
      userPrincipalName: body.userPrincipalName,
      mailNickname: body.mailNickname,
      password: body.password,
      forceChangePasswordNextSignIn: body.forceChangePassword ?? true,
      jobTitle: body.jobTitle,
      department: body.department,
    })

    // Audit log
    await prisma.m365AuditAction.create({
      data: {
        tenantId,
        clientTenantId: body.clientTenantId || '',
        actorId: session.user.id || 'system',
        actorEmail: session.user.email || 'system@rxtech.app',
        action: 'user_create',
        targetId: result.id || '',
        targetName: result.displayName || body.displayName,
      },
    })

    return Response.json(result, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
