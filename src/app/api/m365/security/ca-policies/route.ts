// ============================================================
// GET /api/m365/security/ca-policies — List Conditional Access policies
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { resolveTenantId } from '@/lib/instrumentation/tenant-context'
import { getGraphTokenForTenant } from '@/lib/graph/auth'
import { listConditionalAccessPolicies } from '@/lib/graph/security'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    await resolveTenantId()

    const url = new URL(request.url)
    const clientTenantId = url.searchParams.get('clientTenantId') || process.env.AZURE_AD_TENANT_ID || ''

    const token = await getGraphTokenForTenant(clientTenantId)

    const policies = await listConditionalAccessPolicies(token)

    return Response.json({ policies })
  } catch (error) {
    return handleApiError(error)
  }
}
