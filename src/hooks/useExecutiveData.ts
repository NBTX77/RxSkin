'use client'

import { useQuery } from '@tanstack/react-query'
import type { DepartmentCode } from '@/types'

// ── Response Types ───────────────────────────────────────────

export interface ExecutiveKPI {
  label: string
  value: string | number
  phase2?: boolean
}

export interface DepartmentPerformance {
  id: DepartmentCode
  name: string
  tickets: number
  projects: number
  members: number
}

export interface ProjectHealthEntry {
  id: number
  name: string
  status: 'on-track' | 'watch' | 'over-budget'
  department: DepartmentCode
  budgetHours: number
  actualHours: number
  utilizationPct: number
}

export interface DepartmentUtilization {
  name: string
  department: DepartmentCode
  totalHours: number
  memberCount: number
  utilization: number
}

export interface ExecutiveHighlight {
  id: number
  type: 'success' | 'alert' | 'warning' | 'info'
  title: string
  subtitle: string
}

export interface ExecutiveDashboardData {
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

// ── Hook ─────────────────────────────────────────────────────

export function useExecutiveData() {
  return useQuery<ExecutiveDashboardData>({
    queryKey: ['dashboard', 'executive'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/executive')
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Failed to fetch executive dashboard: ${res.status} ${body}`)
      }
      return res.json()
    },
    staleTime: 5 * 60 * 1000,       // 5 minutes
    refetchInterval: 5 * 60 * 1000,  // Auto-refresh every 5 minutes
  })
}
