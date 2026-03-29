// ============================================================
// GET /api/projects  — List projects
// PATCH /api/projects — Update project status (kanban drag-drop)
// ============================================================

import { auth } from '@/lib/auth/config'
import { getTenantCredentials } from '@/lib/auth/credentials'
import { getProjects, updateProject } from '@/lib/cw/client'
import { cachedFetch, invalidateCache } from '@/lib/cache/bff-cache'
import { deduplicatedFetch } from '@/lib/cache/dedup'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { z } from 'zod'
import type { ProjectFilters, DepartmentCode } from '@/types'
import { DEPARTMENTS } from '@/types'

export const dynamic = 'force-dynamic'

const PROJECTS_LIST_TTL_MS = 60 * 1000 // 60 seconds

function isCWConfigured(): boolean {
  return !!(process.env.CW_BASE_URL && process.env.CW_PUBLIC_KEY && process.env.CW_PRIVATE_KEY)
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    if (!isCWConfigured()) {
      return Response.json(
        { code: 'SERVICE_UNAVAILABLE', message: 'ConnectWise API not configured', retryable: false },
        { status: 503 }
      )
    }

    const { tenantId } = session.user
    const { searchParams } = new URL(request.url)

    // Parse query filters
    const boardFilter = searchParams.get('board') ?? undefined
    const statusFilter = searchParams.get('status') ?? undefined
    const managerIdFilter = searchParams.get('managerId') ?? undefined
    const companyIdFilter = searchParams.get('companyId')
      ? Number(searchParams.get('companyId'))
      : undefined
    const searchTerm = searchParams.get('search') ?? undefined
    const departmentFilter = searchParams.get('department') as DepartmentCode | undefined

    // Map department to CW department names for filtering
    const board = boardFilter
    let cwDepartments: string[] | undefined
    if (departmentFilter && departmentFilter in DEPARTMENTS) {
      const deptConfig = DEPARTMENTS[departmentFilter]
      // Use CW department names (e.g., "IT", "Systems Integration") for proper filtering
      if (deptConfig.cwDepartments.length > 0 && !boardFilter) {
        cwDepartments = deptConfig.cwDepartments
      }
    }

    const filters: ProjectFilters = {
      board,
      cwDepartments,
      status: statusFilter,
      managerId: managerIdFilter,
      companyId: companyIdFilter,
      search: searchTerm,
      closedFlag: false, // List open projects by default
    }

    const cacheKey = `${tenantId}:projects:list:${JSON.stringify(filters)}`

    const projects = await deduplicatedFetch(cacheKey, () =>
      cachedFetch(
        cacheKey,
        async () => {
          const creds = await getTenantCredentials(tenantId)
          return getProjects(creds, filters)
        },
        PROJECTS_LIST_TTL_MS
      )
    )

    return Response.json(projects)
  } catch (error) {
    return handleApiError(error)
  }
}

const updateProjectSchema = z.object({
  projectId: z.number(),
  patches: z.array(
    z.object({
      op: z.enum(['replace', 'add', 'remove']),
      path: z.string(),
      value: z.unknown(),
    })
  ),
})

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()
    if (session.user.role === 'VIEWER') return apiErrors.forbidden()

    const { tenantId } = session.user
    const body = await request.json()

    const parsed = updateProjectSchema.safeParse(body)
    if (!parsed.success) {
      return apiErrors.badRequest(parsed.error.issues.map(i => i.message).join(', '))
    }

    const creds = await getTenantCredentials(tenantId)
    const project = await updateProject(creds, parsed.data.projectId, parsed.data.patches)

    // Bust project list caches so updated project appears
    invalidateCache(`${tenantId}:projects:list:`)
    invalidateCache(`${tenantId}:projects:detail:${parsed.data.projectId}`)

    return Response.json(project)
  } catch (error) {
    return handleApiError(error)
  }
}
