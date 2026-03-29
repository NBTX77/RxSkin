// ============================================================
// GET /api/projects/[id] — Get single project detail
// ============================================================

import { auth } from '@/lib/auth/config'
import { getTenantCredentials } from '@/lib/auth/credentials'
import { getProject } from '@/lib/cw/client'
import { cachedFetch } from '@/lib/cache/bff-cache'
import { deduplicatedFetch } from '@/lib/cache/dedup'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import type { Project } from '@/types'

export const dynamic = 'force-dynamic'

const PROJECT_DETAIL_TTL_MS = 30 * 1000 // 30 seconds

function isCWConfigured(): boolean {
  return !!(process.env.CW_BASE_URL && process.env.CW_PUBLIC_KEY && process.env.CW_PRIVATE_KEY)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { id } = await params
    const projectId = Number(id)

    if (isNaN(projectId)) {
      return apiErrors.badRequest('Invalid project ID')
    }

    if (!isCWConfigured()) {
      return Response.json(
        { code: 'SERVICE_UNAVAILABLE', message: 'ConnectWise API not configured', retryable: false },
        { status: 503 }
      )
    }

    const { tenantId } = session.user
    const cacheKey = `${tenantId}:projects:detail:${projectId}`

    const project = await deduplicatedFetch(cacheKey, () =>
      cachedFetch(
        cacheKey,
        async () => {
          const creds = await getTenantCredentials(tenantId)
          return getProject(creds, projectId)
        },
        PROJECT_DETAIL_TTL_MS
      )
    )

    return Response.json(project)
  } catch (error) {
    return handleApiError(error)
  }
}
