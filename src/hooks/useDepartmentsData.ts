'use client'

import { useQuery } from '@tanstack/react-query'
import type { DepartmentCode } from '@/types'

// ── Response Types ───────────────────────────────────────────

export interface RecentTicket {
  id: number
  summary: string
  status: string
  priority: string
}

export interface DepartmentData {
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

export interface DepartmentsResponse {
  departments: DepartmentData[]
  dataStatus: 'live' | 'partial'
  errors: string[]
  fetchedAt: string
}

// ── Hook ─────────────────────────────────────────────────────

export function useDepartmentsData() {
  return useQuery<DepartmentsResponse>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await fetch('/api/departments')
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Failed to fetch departments: ${res.status} ${body}`)
      }
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}
