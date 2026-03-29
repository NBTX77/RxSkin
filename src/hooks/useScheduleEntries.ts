'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ScheduleEntry } from '@/types'

interface UseScheduleEntriesOptions {
  date: string // YYYY-MM-DD
  view: 'day' | 'week' | 'twoWeek' | 'month'
  memberId?: number
  department?: string // RX dept code filter (e.g. 'IT', 'SI')
}

export function useScheduleEntries({ date, view, memberId, department }: UseScheduleEntriesOptions) {
  const params = new URLSearchParams({ date, view })
  if (memberId) params.set('memberId', String(memberId))
  if (department && department !== 'all') params.set('department', department)

  return useQuery<ScheduleEntry[]>({
    queryKey: ['schedule', 'entries', date, view, memberId, department],
    queryFn: async () => {
      const res = await fetch(`/api/schedule?${params}`)
      if (!res.ok) throw new Error('Failed to fetch schedule entries')
      return res.json()
    },
    staleTime: 30_000,
    refetchInterval: 60_000, // Auto-refresh every minute
  })
}

/**
 * Mutation to reschedule an entry (drag-and-drop).
 */
export function useRescheduleEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      entryId,
      start,
      end,
    }: {
      entryId: number
      start: string
      end: string
    }) => {
      const res = await fetch(`/api/schedule/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateStart: start, dateEnd: end }),
      })
      if (!res.ok) throw new Error('Failed to reschedule entry')
      return res.json()
    },
    onSuccess: () => {
      // Invalidate all schedule queries to refetch
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
    },
  })
}

/**
 * Mutation to create a new schedule entry.
 */
export function useCreateScheduleEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      ticketId: number
      memberId: number
      start: string
      end: string
    }) => {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create schedule entry')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
    },
  })
}

/**
 * Mutation to delete a schedule entry.
 */
export function useDeleteScheduleEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entryId: number) => {
      const res = await fetch(`/api/schedule/${entryId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete schedule entry')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
    },
  })
}
