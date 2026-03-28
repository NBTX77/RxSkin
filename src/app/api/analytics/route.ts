// ============================================================
// GET /api/analytics — Aggregated ticket analytics
// ============================================================

import { auth } from '@/lib/auth/config'
import { getTenantCredentials } from '@/lib/auth/credentials'
import { getTickets } from '@/lib/cw/client'
import { cachedFetch } from '@/lib/cache/bff-cache'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getMockTickets } from '@/lib/mock-data'
import type { AnalyticsData } from '@/types/ops'
import type { Ticket } from '@/types'

export const dynamic = 'force-dynamic'

const ANALYTICS_CACHE_TTL_MS = 60 * 1000 // 60 seconds

function isCWConfigured(): boolean {
  return !!(process.env.CW_BASE_URL && process.env.CW_PUBLIC_KEY && process.env.CW_PRIVATE_KEY)
}

function aggregateAnalytics(tickets: Ticket[]): AnalyticsData {
  // KPIs
  const openStatuses = ['New', 'In Progress', 'Waiting Customer', 'Waiting Vendor', 'Schedule Hold', 'Scheduled']
  const openTickets = tickets.filter((t) => openStatuses.includes(t.status))

  const byBoard: Record<string, number> = {}
  for (const t of openTickets) {
    byBoard[t.board] = (byBoard[t.board] ?? 0) + 1
  }

  const inProgress = tickets.filter((t) => t.status === 'In Progress').length
  const highCritical = tickets.filter(
    (t) => t.priority === 'High' || t.priority === 'Critical' || t.priority === 'Priority 1 - Critical' || t.priority === 'Priority 2 - High'
  ).length
  const multiTech = tickets.filter((t) => (t.resources?.length ?? 0) > 1).length

  // Status breakdown
  const statusMap = new Map<string, number>()
  for (const t of tickets) {
    statusMap.set(t.status, (statusMap.get(t.status) ?? 0) + 1)
  }
  const statusBreakdown = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)

  // Priority breakdown with colors
  const priorityColors: Record<string, string> = {
    'Critical': '#f85149',
    'Priority 1 - Critical': '#f85149',
    'High': '#f0883e',
    'Priority 2 - High': '#f0883e',
    'Medium': '#d29922',
    'Priority 3 - Medium': '#d29922',
    'Low': '#3fb950',
    'Priority 4 - Low': '#3fb950',
  }
  const priorityMap = new Map<string, number>()
  for (const t of tickets) {
    priorityMap.set(t.priority, (priorityMap.get(t.priority) ?? 0) + 1)
  }
  const priorityBreakdown = Array.from(priorityMap.entries())
    .map(([priority, count]) => ({
      priority,
      count,
      color: priorityColors[priority] ?? '#8b949e',
    }))
    .sort((a, b) => b.count - a.count)

  // Tech workload (top 8)
  const workloadMap = new Map<string, number>()
  for (const t of openTickets) {
    if (t.assignedTo) {
      workloadMap.set(t.assignedTo, (workloadMap.get(t.assignedTo) ?? 0) + 1)
    }
  }
  const techWorkload = Array.from(workloadMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  return {
    ok: true,
    kpis: {
      openTickets: { total: openTickets.length, byBoard },
      inProgress,
      highCritical,
      multiTech,
    },
    statusBreakdown,
    priorityBreakdown,
    techWorkload,
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { tenantId } = session.user
    const cacheKey = `${tenantId}:analytics`

    const data = await cachedFetch<AnalyticsData>(
      cacheKey,
      async () => {
        if (!isCWConfigured()) {
          // Use mock data
          const mockTickets = getMockTickets()
          return aggregateAnalytics(mockTickets)
        }

        const creds = await getTenantCredentials(tenantId)
        // Fetch all open tickets across SI boards
        const tickets = await getTickets(creds, {
          status: ['New', 'In Progress', 'Waiting Customer', 'Waiting Vendor', 'Schedule Hold', 'Scheduled', 'Completed', 'Closed'],
          pageSize: 500,
        })
        return aggregateAnalytics(tickets)
      },
      ANALYTICS_CACHE_TTL_MS
    )

    return Response.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}
