// ============================================================
// Executive Dashboard BFF API Route — RX Skin
// Aggregates tickets, projects, members, and time entries
// into a single response for the Leadership Team dashboard.
// ============================================================

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getTenantCredentials } from '@/lib/auth/credentials'
import { resolveTenantId } from '@/lib/instrumentation/tenant-context'
import { getTickets, getProjects, getMembers, getAllTimeEntries } from '@/lib/cw/client'
import type { Ticket, Project, Member, DepartmentCode } from '@/types'
import { DEPARTMENTS } from '@/types'

// ── Response Types ───────────────────────────────────────────

interface ExecutiveKPI {
  label: string
  value: string | number
  phase2?: boolean
}

interface DepartmentPerformance {
  id: DepartmentCode
  name: string
  tickets: number
  projects: number
  members: number
}

interface ProjectHealthEntry {
  id: number
  name: string
  status: 'on-track' | 'watch' | 'over-budget'
  department: DepartmentCode
  budgetHours: number
  actualHours: number
  utilizationPct: number
}

interface DepartmentUtilization {
  name: string
  department: DepartmentCode
  totalHours: number
  memberCount: number
  utilization: number
}

interface ExecutiveHighlight {
  id: number
  type: 'success' | 'alert' | 'warning' | 'info'
  title: string
  subtitle: string
}

interface ExecutiveDashboardResponse {
  kpis: ExecutiveKPI[]
  departments: DepartmentPerformance[]
  projectHealth: {
    it: ProjectHealthEntry[]
    si: ProjectHealthEntry[]
    ga: ProjectHealthEntry[]
  }
  utilization: DepartmentUtilization[]
  highlights: ExecutiveHighlight[]
  dataStatus: 'live' | 'partial'
  errors: string[]
  fetchedAt: string
}

// ── Board → Department Mapping ───────────────────────────────

const BOARD_TO_DEPT: Record<string, DepartmentCode> = {}

// Build reverse map from DEPARTMENTS config
for (const [code, config] of Object.entries(DEPARTMENTS)) {
  for (const board of config.cwBoards) {
    // Normalize by trimming whitespace (CW board names sometimes have trailing spaces)
    BOARD_TO_DEPT[board.trim().toLowerCase()] = code as DepartmentCode
  }
}

function getBoardDept(boardName: string): DepartmentCode {
  return BOARD_TO_DEPT[boardName.trim().toLowerCase()] ?? 'IT'
}

// ── Health Calculation ───────────────────────────────────────

function computeProjectHealth(project: Project): 'on-track' | 'watch' | 'over-budget' {
  if (project.budgetHours <= 0) return 'on-track' // no budget set
  const ratio = project.actualHours / project.budgetHours
  if (ratio > 1.0) return 'over-budget'
  if (ratio > 0.8) return 'watch'
  return 'on-track'
}

// ── GET Handler ──────────────────────────────────────────────

export async function GET() {
  try {
    const tenantId = await resolveTenantId()
    const creds = await getTenantCredentials(tenantId)

    // Fetch all data sources in parallel with resilience
    const [ticketsResult, projectsResult, membersResult, timeResult] = await Promise.allSettled([
      getTickets(creds, { conditions: 'closedFlag=false', pageSize: 1000 }),
      getProjects(creds, { closedFlag: false }),
      getMembers(creds),
      getAllTimeEntries(creds, { pageSize: 500 }),
    ])

    const errors: string[] = []

    // Extract results with fallbacks
    const tickets: Ticket[] = ticketsResult.status === 'fulfilled' ? ticketsResult.value : []
    if (ticketsResult.status === 'rejected') errors.push(`tickets: ${String(ticketsResult.reason)}`)

    const projects: Project[] = projectsResult.status === 'fulfilled' ? projectsResult.value : []
    if (projectsResult.status === 'rejected') errors.push(`projects: ${String(projectsResult.reason)}`)

    const members: Member[] = membersResult.status === 'fulfilled' ? membersResult.value : []
    if (membersResult.status === 'rejected') errors.push(`members: ${String(membersResult.reason)}`)

    const rawTimeEntries: Record<string, unknown>[] = timeResult.status === 'fulfilled' ? timeResult.value : []
    if (timeResult.status === 'rejected') errors.push(`timeEntries: ${String(timeResult.reason)}`)

    // ── KPIs ───────────────────────────────────────────────────
    const openTickets = tickets.length
    const activeProjects = projects.filter(p => !p.closedFlag).length
    const projectsOverBudget = projects.filter(p => p.budgetHours > 0 && p.actualHours > p.budgetHours).length

    const kpis: ExecutiveKPI[] = [
      { label: 'Open Tickets', value: openTickets },
      { label: 'Active Projects', value: activeProjects },
      { label: 'Monthly Revenue', value: '\u2014', phase2: true },
      { label: 'Projects Over Budget', value: projectsOverBudget },
      { label: 'SLA Compliance', value: '\u2014', phase2: true },
    ]

    // ── Department Performance ──────────────────────────────────
    const deptTicketCounts: Record<DepartmentCode, number> = { IT: 0, SI: 0, AM: 0, GA: 0, LT: 0 }
    const deptProjectCounts: Record<DepartmentCode, number> = { IT: 0, SI: 0, AM: 0, GA: 0, LT: 0 }
    const deptMemberCounts: Record<DepartmentCode, number> = { IT: 0, SI: 0, AM: 0, GA: 0, LT: 0 }

    for (const ticket of tickets) {
      const dept = getBoardDept(ticket.board)
      deptTicketCounts[dept]++
    }

    for (const project of projects) {
      const dept = project.department ?? 'IT'
      deptProjectCounts[dept]++
    }

    for (const member of members) {
      const dept = member.department ?? 'IT'
      deptMemberCounts[dept]++
    }

    const departmentPerf: DepartmentPerformance[] = (
      ['IT', 'SI', 'AM', 'GA'] as DepartmentCode[]
    ).map(code => ({
      id: code,
      name: DEPARTMENTS[code].label,
      tickets: deptTicketCounts[code],
      projects: deptProjectCounts[code],
      members: deptMemberCounts[code],
    }))

    // ── Project Health Matrix ───────────────────────────────────
    const projectsByDept: Record<'it' | 'si' | 'ga', ProjectHealthEntry[]> = {
      it: [],
      si: [],
      ga: [],
    }

    for (const project of projects) {
      const dept = project.department ?? 'IT'
      const health = computeProjectHealth(project)
      const utilizationPct = project.budgetHours > 0
        ? Math.round((project.actualHours / project.budgetHours) * 100)
        : 0

      const entry: ProjectHealthEntry = {
        id: project.id,
        name: project.name,
        status: health,
        department: dept,
        budgetHours: project.budgetHours,
        actualHours: project.actualHours,
        utilizationPct,
      }

      if (dept === 'IT') projectsByDept.it.push(entry)
      else if (dept === 'SI') projectsByDept.si.push(entry)
      else if (dept === 'GA') projectsByDept.ga.push(entry)
    }

    // ── Utilization ─────────────────────────────────────────────
    // Build a member identifier → department map
    const memberDeptMap = new Map<string, DepartmentCode>()
    for (const member of members) {
      memberDeptMap.set(member.identifier, member.department ?? 'IT')
    }

    const deptHours: Record<DepartmentCode, number> = { IT: 0, SI: 0, AM: 0, GA: 0, LT: 0 }

    for (const entry of rawTimeEntries) {
      const memberObj = entry.member as Record<string, unknown> | undefined
      if (!memberObj) continue
      const identifier = typeof memberObj.identifier === 'string' ? memberObj.identifier : ''
      const hours = typeof entry.actualHours === 'number' ? entry.actualHours : 0
      const dept = memberDeptMap.get(identifier) ?? 'IT'
      deptHours[dept] += hours
    }

    // Standard work hours per month assumption: 160 per member
    const MONTHLY_HOURS = 160
    const utilization: DepartmentUtilization[] = (
      ['IT', 'SI', 'AM', 'GA'] as DepartmentCode[]
    ).map(code => {
      const memberCount = deptMemberCounts[code]
      const totalHours = Math.round(deptHours[code] * 10) / 10
      const capacity = memberCount * MONTHLY_HOURS
      const utilizationPct = capacity > 0 ? Math.round((totalHours / capacity) * 100) : 0

      return {
        name: DEPARTMENTS[code].name,
        department: code,
        totalHours,
        memberCount,
        utilization: utilizationPct,
      }
    })

    // ── Highlights (auto-generated) ─────────────────────────────
    const highlights: ExecutiveHighlight[] = []
    let highlightId = 1

    // Over-budget projects alert
    if (projectsOverBudget > 0) {
      const overBudgetNames = projects
        .filter(p => p.budgetHours > 0 && p.actualHours > p.budgetHours)
        .slice(0, 3)
        .map(p => p.name)
      highlights.push({
        id: highlightId++,
        type: 'alert',
        title: `${projectsOverBudget} project${projectsOverBudget > 1 ? 's' : ''} over budget`,
        subtitle: overBudgetNames.join(', '),
      })
    }

    // Departments with high ticket counts
    const highTicketDepts = departmentPerf.filter(d => d.tickets > 50)
    for (const dept of highTicketDepts) {
      highlights.push({
        id: highlightId++,
        type: 'info',
        title: `${dept.name}: ${dept.tickets} open tickets`,
        subtitle: 'Monitor queue depth and capacity',
      })
    }

    // Watch-status projects warning
    const watchProjects = projects.filter(p => computeProjectHealth(p) === 'watch')
    if (watchProjects.length > 0) {
      highlights.push({
        id: highlightId++,
        type: 'warning',
        title: `${watchProjects.length} project${watchProjects.length > 1 ? 's' : ''} approaching budget`,
        subtitle: watchProjects.slice(0, 3).map(p => p.name).join(', '),
      })
    }

    // Incomplete handoff projects
    const incompleteHandoffs = projects.filter(p => p.status === 'Incomplete Handoff')
    if (incompleteHandoffs.length > 0) {
      highlights.push({
        id: highlightId++,
        type: 'warning',
        title: `${incompleteHandoffs.length} incomplete handoff${incompleteHandoffs.length > 1 ? 's' : ''} pending`,
        subtitle: 'Follow-up required from project managers',
      })
    }

    // If no highlights were generated, add a default
    if (highlights.length === 0) {
      highlights.push({
        id: highlightId++,
        type: 'success',
        title: 'All systems nominal',
        subtitle: 'No critical issues detected',
      })
    }

    // ── Response ────────────────────────────────────────────────
    const dataStatus = errors.length > 0 ? 'partial' : 'live'

    const response: ExecutiveDashboardResponse = {
      kpis,
      departments: departmentPerf,
      projectHealth: projectsByDept,
      utilization,
      highlights,
      dataStatus,
      errors,
      fetchedAt: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[executive-dashboard] Fatal error:', err)
    return NextResponse.json(
      { error: 'Failed to load executive dashboard data', detail: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
