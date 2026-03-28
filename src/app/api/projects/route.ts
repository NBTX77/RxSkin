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
import type { Project, ProjectFilters, DepartmentCode } from '@/types'
import { DEPARTMENTS } from '@/types'

export const dynamic = 'force-dynamic'

const PROJECTS_LIST_TTL_MS = 60 * 1000 // 60 seconds

function isCWConfigured(): boolean {
  return !!(process.env.CW_BASE_URL && process.env.CW_PUBLIC_KEY && process.env.CW_PRIVATE_KEY)
}

/**
 * Generate mock projects for testing when CW is not configured.
 */
function getMockProjects(): Project[] {
  const now = new Date()
  const mockProjects: Project[] = [
    {
      id: 1001,
      name: 'Meridian Healthcare - Network Upgrade',
      status: 'Assigned to PM',
      statusId: 30,
      board: 'Systems Integration (Service)',
      boardId: 25,
      department: 'SI',
      company: 'Meridian Healthcare',
      companyId: 1,
      manager: 'Travis Brown',
      managerId: 'TBrown',
      estimatedStart: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedEnd: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      actualStart: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      budgetHours: 320,
      actualHours: 156,
      billingMethod: 'ActualRates',
      closedFlag: false,
    },
    {
      id: 1002,
      name: 'Apex Financial - Security Assessment',
      status: 'In Progress',
      statusId: 33,
      board: 'Systems Integration (Security)',
      boardId: 26,
      department: 'SI',
      company: 'Apex Financial Group',
      companyId: 2,
      manager: 'Jake Smith',
      managerId: 'JSmith',
      estimatedStart: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedEnd: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      actualStart: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      budgetHours: 480,
      actualHours: 298,
      billingMethod: 'ActualRates',
      closedFlag: false,
    },
    {
      id: 1003,
      name: 'Summit Legal - Managed Services Setup',
      status: 'New',
      statusId: 10,
      board: 'Managed Services',
      boardId: 1,
      department: 'IT',
      company: 'Summit Legal Partners',
      companyId: 3,
      manager: 'Amanda Jones',
      managerId: 'AJones',
      estimatedStart: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      budgetHours: 160,
      actualHours: 0,
      billingMethod: 'ActualRates',
      closedFlag: false,
    },
    {
      id: 1004,
      name: 'Cascade Manufacturing - IT Infrastructure',
      status: 'Incomplete Handoff',
      statusId: 20,
      board: 'Managed Services',
      boardId: 1,
      department: 'IT',
      company: 'Cascade Manufacturing',
      companyId: 4,
      manager: 'Chris Wilson',
      managerId: 'CWilson',
      estimatedStart: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      actualStart: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      budgetHours: 240,
      actualHours: 89,
      billingMethod: 'ActualRates',
      closedFlag: false,
    },
    {
      id: 1005,
      name: 'Lighthouse Education - Firewall Replacement',
      status: 'Completed',
      statusId: 50,
      board: 'Engineering',
      boardId: 2,
      department: 'IT',
      company: 'Lighthouse Education',
      companyId: 5,
      manager: 'Travis Brown',
      managerId: 'TBrown',
      estimatedStart: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedEnd: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      actualStart: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      actualEnd: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      budgetHours: 120,
      actualHours: 115,
      billingMethod: 'ActualRates',
      closedFlag: true,
    },
    {
      id: 1006,
      name: 'Pinnacle Engineering - Communications Upgrade',
      status: 'In Progress',
      statusId: 33,
      board: 'Systems Integration (Communication)',
      boardId: 27,
      department: 'SI',
      company: 'Pinnacle Engineering',
      companyId: 6,
      manager: 'Jake Smith',
      managerId: 'JSmith',
      estimatedStart: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedEnd: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000).toISOString(),
      actualStart: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      budgetHours: 200,
      actualHours: 78,
      billingMethod: 'ActualRates',
      closedFlag: false,
    },
  ]
  return mockProjects
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    // If CW credentials not configured, return mock data for testing
    if (!isCWConfigured()) {
      let projects = getMockProjects()
      const { searchParams } = new URL(request.url)
      const searchTerm = searchParams.get('search')?.toLowerCase()
      const statusFilter = searchParams.get('status')
      const departmentFilter = searchParams.get('department') as DepartmentCode | null
      const managerId = searchParams.get('managerId')
      const companyId = searchParams.get('companyId')

      if (searchTerm) {
        projects = projects.filter(p =>
          p.name.toLowerCase().includes(searchTerm) ||
          p.company.toLowerCase().includes(searchTerm) ||
          String(p.id).includes(searchTerm)
        )
      }

      if (statusFilter) {
        projects = projects.filter(p => p.status === statusFilter)
      }

      if (departmentFilter) {
        projects = projects.filter(p => p.department === departmentFilter)
      }

      if (managerId) {
        projects = projects.filter(p => p.managerId === managerId)
      }

      if (companyId) {
        projects = projects.filter(p => p.companyId === Number(companyId))
      }

      return Response.json(projects)
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

    // Map department to board names if provided
    let board = boardFilter
    if (departmentFilter && departmentFilter in DEPARTMENTS) {
      // For department filter, we could expand to all boards in that dept
      // For now, just use the board param if provided
      const deptConfig = DEPARTMENTS[departmentFilter]
      if (deptConfig.cwBoards.length > 0 && !boardFilter) {
        // Could use multiple boards here with OR logic
        // For simplicity, use first board
        board = deptConfig.cwBoards[0]
      }
    }

    const filters: ProjectFilters = {
      board,
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
      value: z.unknown().optional(),
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