// ============================================================
// GET /api/m365/security/sign-ins — List Azure AD sign-in logs
// Requires Azure AD Premium P1/P2. Returns 402 if not licensed.
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { resolveTenantId } from '@/lib/instrumentation/tenant-context'
import { getGraphTokenForTenant } from '@/lib/graph/auth'
import { listSignIns } from '@/lib/graph/security'

export const dynamic = 'force-dynamic'

function isPremiumRequiredError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message
  return (
    msg.includes('Authorization_RequestDenied') ||
    msg.includes('Forbidden') ||
    msg.includes('403') ||
    msg.includes('404')
  )
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    await resolveTenantId()

    const url = new URL(request.url)
    const clientTenantId = url.searchParams.get('clientTenantId') || process.env.AZURE_AD_TENANT_ID || ''
    const top = url.searchParams.get('top') ? parseInt(url.searchParams.get('top')!, 10) : 50
    const filter = url.searchParams.get('filter') || undefined

    const token = await getGraphTokenForTenant(clientTenantId)

    const result = await listSignIns(token, { top, filter })

    return Response.json({ signIns: result.signIns, nextLink: result.nextLink })
  } catch (error) {
    if (isPremiumRequiredError(error)) {
      return Response.json(
        { error: 'premium_required', message: 'Requires Azure AD Premium P2' },
        { status: 402 }
      )
    }
    return handleApiError(error)
  }
}
