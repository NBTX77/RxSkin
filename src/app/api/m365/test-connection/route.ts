// ============================================================
// POST /api/m365/test-connection — Test Graph API connectivity
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getGraphToken, getGraphTokenForTenant } from '@/lib/graph/auth'
import { graphFetch } from '@/lib/graph/client'

export const dynamic = 'force-dynamic'

interface TestConnectionBody {
  clientTenantId?: string
}

interface OrganizationResponse {
  value?: Array<{ displayName?: string }>
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const body = (await request.json()) as Partial<TestConnectionBody>

    // Acquire token — either for a specific client tenant or the RX Technology tenant
    let token: string
    if (body.clientTenantId) {
      token = await getGraphTokenForTenant(body.clientTenantId)
    } else {
      token = await getGraphToken()
    }

    // Test the connection by calling /organization
    const data = (await graphFetch('/organization', { token })) as OrganizationResponse

    const orgName =
      data.value?.[0]?.displayName ?? 'Unknown Organization'

    return Response.json({
      success: true,
      organizationName: orgName,
    })
  } catch (error) {
    // Return structured error rather than generic 500
    if (error instanceof Error) {
      return Response.json(
        {
          success: false,
          error: error.message,
        },
        { status: 200 }
      )
    }
    return handleApiError(error)
  }
}
