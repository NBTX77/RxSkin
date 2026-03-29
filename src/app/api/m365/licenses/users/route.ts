// ============================================================
// GET /api/m365/licenses/users — List users with assigned licenses
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { resolveTenantId } from '@/lib/instrumentation/tenant-context'
import { getGraphTokenForTenant } from '@/lib/graph/auth'
import { graphFetch } from '@/lib/graph/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    await resolveTenantId()

    const url = new URL(request.url)
    const clientTenantId = url.searchParams.get('clientTenantId') || process.env.AZURE_AD_TENANT_ID || ''
    const top = url.searchParams.get('top') ? parseInt(url.searchParams.get('top')!, 10) : 100

    const token = await getGraphTokenForTenant(clientTenantId)

    const result = await graphFetch(
      `/users?$select=id,displayName,userPrincipalName,assignedLicenses&$top=${top}`,
      { token }
    )

    return Response.json({ users: result.value ?? [] })
  } catch (error) {
    return handleApiError(error)
  }
}
