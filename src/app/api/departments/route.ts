// ============================================================
// Departments BFF API Route — RX Skin
// Aggregates tickets, projects, and members by department.
// ============================================================

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getTenantCredentials } from '@/lib/auth/credentials'
import { resolveTenantId } from '@/lib/instrumentation/tenant-context'
import { getTickets, getProjects, getMembers } from '@/lib/cw/client'
import type { Ticket, Project, Member, DepartmentCode } from '@/types'
import { DEPARTMENTS } from '@/types'

// ── Board -> Department Mapping ─────────────────────────────

const BOARD_TO_DEPT: Record<string, DepartmentCode> = {}

for (const [code, config] of Object.entries(DEPARTMENTS)) {
  for (const board of config.cwBoards) {
    BOARD_TO_DEPT[board.trim().toLowerCase()] = code as DepartmentCode
  }
}

function getBoardDept(boardName: string): DepartmentCode {
  return BOARD_TO_DEPT[boardName.trim().toLowerCase()] ?? 'IT'
}

// ── Health Helpers ──────────────────────────────────────────

function computeProjectHealth(project: Project): 'onTrack' | 'watch' | 'overBudget' {
  if (project.budgetHours <= 0) return 'onTrack'
  const ratio = project.actualHours / project.budgetHours
  if (ratio > 1.0) return 'overBudget'
  if (ratio > 0.8) return 'watch'
  return 'onTrack'
}

// ── Response Types ──────────────────────────────────────────

interface RecentTicket {
  id: number
  summary: string
  status: string
  priority: string
}

interface DepartmentData {
  code: DepartmentCode
  name: string
  color: string
  openTickets: number
  activeProjects: number
  members: number
  budgetHours: number
  actualHours: number
  utilizationPct: number
  ticketsByStatus: Record<string, number>
  projectsByHealth: { onTrack: number; watch: number; overBudget: number }
  recentTickets: RecentTicket[]
}

// ── GET Handler ─────────────────────────────────────────────

export async function GET() {
  try {
    const tenantId = await resolveTenantId()
    const creds = await getTenantCredentials(tenantId)

    const [ticketsResult, projectsResult, membersResult] = await Promise.allSettled([
      getTickets(creds, { conditions: 'closedFlag=false', pageSize: 1000 }),
      getProjects(creds, { closedFlag: false }),
      getMembers(creds),
    ])

    const errors: string[] = []

    const tickets: Ticket[] = ticketsResult.status === 'fulfilled' ? ticketsResult.value : []
    if (ticketsResult.status === 'rejected') errors.push(`tickets: ${String(ticketsResult.reason)}`)

    const projects: Project[] = projectsResult.status === 'fulfilled' ? projectsResult.value : []
    if (projectsResult.status === 'rejected') errors.push(`projects: ${String(projectsResult.reason)}`)

    const members: Member[] = membersResult.status === 'fulfilled' ? membersResult.value : []
    if (membersResult.status === 'rejected') errors.push(`members: ${String(membersResult.reason)}`)

    // ── Group by department ──────────────────────────────────

    const deptCodes: DepartmentCode[] = ['IT', 'SI', 'AM', 'GA', 'LT']

    // Tickets grouped by dept
    const deptTickets: Record<DepartmentCode, Ticket[]> = { IT: [], SI: [], AM: [], GA: [], LT: [] }
    for (const ticket of tickets) {
      const dept = getBoardDept(ticket.board)
      deptTickets[dept].push(ticket)
    }

    // Projects grouped by dept
    const deptProjects: Record<DepartmentCode, Project[]> = { IT: [], SI: [], AM: [], GA: [], LT: [] }
    for (const project of projects) {
      const dept = project.department ?? 'IT'
      deptProjects[dept].push(project)
    }

    // Members grouped by dept
    const deptMembers: Record<DepartmentCode, Member[]> = { IT: [], SI: [], AM: [], GA: [], LT: [] }
    for (const member of members) {
      const dept = member.department ?? 'IT'
      deptMembers[dept].push(member)
    }

    // ── Build department objects ──────────────────────────────

    const DEPT_COLORS: Record<DepartmentCode, string> = {
      IT: 'blue',
      SI: 'cyan',
      AM: 'emerald',
      GA: 'orange',
      LT: 'purple',
    }

    const departments: DepartmentData[] = deptCodes.map((code) => {
      const config = DEPARTMENTS[code]
      const dTickets = deptTickets[code]
      const dProjects = deptProjects[code]
      const dMembers = deptMembers[code]

      // Ticket status breakdown
      const ticketsByStatus: Record<string, number> = {}
      for (const t of dTickets) {
        ticketsByStatus[t.status] = (ticketsByStatus[t.status] ?? 0) + 1
      }

      // Project health counts
      const projectsByHealth = { onTrack: 0, watch: 0, overBudget: 0 }
      let totalBudgetHours = 0
      let totalActualHours = 0
      for (const p of dProjects) {
        const health = computeProjectHealth(p)
        projectsByHealth[health]++
        totalBudgetHours += p.budgetHours
        totalActualHours += p.actualHours
      }

      const utilizationPct = totalBudgetHours > 0
        ? Math.min(100, Math.round((totalActualHours / totalBudgetHours) * 100))
        : 0

      // Recent tickets (top 5 by most recently updated)
      const recentTickets: RecentTicket[] = dTickets
        .slice(0, 5)
        .map((t) => ({
          id: t.id,
          summary: t.summary,
          status: t.status,
          priority: t.priority,
        }))

      return {
        code,
        name: config.label,
        color: DEPT_COLORS[code],
        openTickets: dTickets.length,
        activeProjects: dProjects.length,
        members: dMembers.length,
        budgetHours: Math.round(totalBudgetHours * 10) / 10,
        actualHours: Math.round(totalActualHours * 10) / 10,
        utilizationPct,
        ticketsByStatus,
        projectsByHealth,
        recentTickets,
      }
    })

    return NextResponse.json({
      departments,
      dataStatus: errors.length > 0 ? 'partial' : 'live',
      errors,
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[departments] Fatal error:', err)
    return NextResponse.json(
      { error: 'Failed to load departments data', detail: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
