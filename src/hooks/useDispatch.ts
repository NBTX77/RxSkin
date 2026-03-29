'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Member, Ticket, ScheduleEntry } from '@/types'

/**
 * Fetch active members (technicians) for dispatch resource rows.
 */
export function useMembers() {
  return useQuery<Member[]>({
    queryKey: ['members', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/members')
      if (!res.ok) throw new Error('Failed to fetch members')
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 min — member data is stable
    refetchInterval: 10 * 60 * 1000,
  })
}

/**
 * Fetch open tickets for the unscheduled sidebar.
 * Filters client-side to exclude tickets that already have schedule entries.
 */
export function useUnscheduledTickets(scheduledTicketIds: Set<number>) {
  return useQuery<Ticket[]>({
    queryKey: ['tickets', 'dispatch-unscheduled'],
    queryFn: async () => {
      const res = await fetch('/api/tickets?pageSize=200&status=New&status=In+Progress&status=Waiting+on+Client')
      if (!res.ok) throw new Error('Failed to fetch tickets')
      const tickets: Ticket[] = await res.json()
      return tickets
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    select: (tickets) => tickets.filter((t) => !scheduledTicketIds.has(t.id)),
  })
}

/**
 * Mutation to reassign a schedule entry to a different tech.
 * Sends PATCH with member/id + optional dateStart/dateEnd.
 */
export function useAssignScheduleEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      entryId,
      memberId,
      start,
      end,
    }: {
      entryId: number
      memberId: number
      start?: string
      end?: string
    }) => {
      const res = await fetch(`/api/schedule/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, dateStart: start, dateEnd: end }),
      })
      if (!res.ok) throw new Error('Failed to reassign schedule entry')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
    },
  })
}

/**
 * Calculate hours scheduled per member for a given set of entries.
 */
export function calculateMemberHours(
  entries: ScheduleEntry[],
  dateStr: string
): Map<number, number> {
  const hoursMap = new Map<number, number>()
  const targetDate = dateStr.split('T')[0]

  for (const entry of entries) {
    const entryDate = entry.start.split('T')[0]
    if (entryDate !== targetDate) continue

    const start = new Date(entry.start).getTime()
    const end = new Date(entry.end).getTime()
    const hours = (end - start) / (1000 * 60 * 60)

    const current = hoursMap.get(entry.memberId) ?? 0
    hoursMap.set(entry.memberId, current + hours)
  }

  return hoursMap
}
