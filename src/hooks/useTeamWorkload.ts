'use client'

import { useQuery } from '@tanstack/react-query'
import type { Member, ScheduleEntry, DepartmentCode } from '@/types'
import type { TechWorkload, WorkloadSummary } from '@/types/team'

const CAPACITY_HOURS = 8

function calculateHoursBetween(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffMs = endDate.getTime() - startDate.getTime()
  return Math.max(0, diffMs / (1000 * 60 * 60))
}

function buildWorkloadData(
  members: Member[],
  entries: ScheduleEntry[],
  departmentFilter?: DepartmentCode
): { techs: TechWorkload[]; summary: WorkloadSummary } {
  // Filter members by department if specified
  const filteredMembers = departmentFilter
    ? members.filter(m => m.department === departmentFilter)
    : members

  // Group entries by memberId
  const entriesByMember = new Map<number, ScheduleEntry[]>()
  for (const entry of entries) {
    const existing = entriesByMember.get(entry.memberId) ?? []
    existing.push(entry)
    entriesByMember.set(entry.memberId, existing)
  }

  // Only include members that have schedule entries for the day
  const techsWithEntries: TechWorkload[] = []

  for (const member of filteredMembers) {
    const memberEntries = entriesByMember.get(member.id) ?? []
    if (memberEntries.length === 0) continue

    const scheduledHours = memberEntries.reduce(
      (sum, e) => sum + calculateHoursBetween(e.start, e.end),
      0
    )
    const utilization = (scheduledHours / CAPACITY_HOURS) * 100

    techsWithEntries.push({
      id: member.id,
      name: member.name,
      identifier: member.identifier,
      department: member.department ?? 'IT',
      scheduledHours: Math.round(scheduledHours * 10) / 10,
      capacity: CAPACITY_HOURS,
      entries: memberEntries.sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      ),
      utilization: Math.round(utilization),
    })
  }

  // Sort by utilization descending (busiest first)
  techsWithEntries.sort((a, b) => b.utilization - a.utilization)

  const activeTechs = techsWithEntries.length
  const avgUtilization =
    activeTechs > 0
      ? Math.round(
          techsWithEntries.reduce((sum, t) => sum + t.utilization, 0) / activeTechs
        )
      : 0
  const overbookedCount = techsWithEntries.filter(t => t.scheduledHours > CAPACITY_HOURS).length
  const availableCount = techsWithEntries.filter(t => t.scheduledHours < 4).length

  return {
    techs: techsWithEntries,
    summary: {
      activeTechs,
      avgUtilization,
      overbookedCount,
      availableCount,
    },
  }
}

export function useTeamWorkload(date: string, department?: DepartmentCode) {
  const membersQuery = useQuery<Member[]>({
    queryKey: ['members'],
    queryFn: async () => {
      const res = await fetch('/api/members')
      if (!res.ok) throw new Error('Failed to fetch members')
      return res.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  const scheduleQuery = useQuery<ScheduleEntry[]>({
    queryKey: ['schedule', 'entries', date, 'day'],
    queryFn: async () => {
      const params = new URLSearchParams({ date, view: 'day' })
      const res = await fetch(`/api/schedule?${params}`)
      if (!res.ok) throw new Error('Failed to fetch schedule entries')
      return res.json()
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const members = membersQuery.data ?? []
  const entries = scheduleQuery.data ?? []

  const { techs, summary } = buildWorkloadData(members, entries, department)

  return {
    techs,
    summary,
    isLoading: membersQuery.isLoading || scheduleQuery.isLoading,
    isError: membersQuery.isError || scheduleQuery.isError,
    error: membersQuery.error ?? scheduleQuery.error,
  }
}
