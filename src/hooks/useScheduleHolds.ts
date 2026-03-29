'use client'

import { useQuery } from '@tanstack/react-query'
import type { FleetData, ScheduleHoldTicket } from '@/types/ops'

export function useScheduleHolds() {
  return useQuery<ScheduleHoldTicket[]>({
    queryKey: ['fleet', 'holds'],
    queryFn: async () => {
      const res = await fetch('/api/fleet')
      if (!res.ok) throw new Error('Failed to fetch schedule holds')
      const data: FleetData = await res.json()
      return data.schedHoldTickets
    },
    staleTime: 30_000,
  })
}
