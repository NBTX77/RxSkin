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

/**
 * Get a mock project by ID.
 */
function getMockProjectById(id: number): Project | undefined {
  const now = new Date()
  const mockProjects: Record<number, Project> = {
    1001: {
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
    1002: {
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
    1003: {
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
    1004: {
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
    1005: {
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
    1006: {
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
  }
  return mockProjects[id]
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

    // If CW credentials not configured, return mock data for testing
    if (!isCWConfigured()) {
      const project = getMockProjectById(projectId)
      if (!project) {
        return apiErrors.notFound('Project')
      }
      return Response.json(project)
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