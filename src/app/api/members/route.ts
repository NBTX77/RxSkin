import { auth } from '@/lib/auth/config'
import { getTenantCredentials } from '@/lib/auth/credentials'
import { getMembers } from '@/lib/cw/client'
import { cachedFetch } from '@/lib/cache/bff-cache'
import { apiErrors, handleApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

const MEMBERS_TTL_MS = 10 * 60 * 1000

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { tenantId } = session.user
    const cacheKey = `${tenantId}:members:all`

    const members = await cachedFetch(
      cacheKey,
      async () => {
        const creds = await getTenantCredentials(tenantId)
        return getMembers(creds)
      },
      MEMBERS_TTL_MS
    )

    return Response.json(members)
  } catch (error) {
    return handleApiError(error)
  }
}
