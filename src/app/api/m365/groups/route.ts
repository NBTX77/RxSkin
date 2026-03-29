// ============================================================
// GET /api/m365/groups — List M365 groups
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { resolveTenantId } from '@/lib/instrumentation/tenant-context'
import { getGraphTokenForTenant } from '@/lib/graph/auth'
import { listGroups } from '@/lib/graph/groups'

export const dynamic = 'force-dynamic'

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

    const token = await getGraphTokenForTenant(
      clientTenantId || process.env.AZURE_AD_TENANT_ID || ''
    )

    const result = await listGroups(token, {
      top: top ? parseInt(top, 10) : undefined,
      filter: filter || undefined,
      search: search || undefined,
    })

    return Response.json({
      groups: result.groups,
      nextLink: result.nextLink,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
