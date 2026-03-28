'use client'

import { useQuery } from '@tanstack/react-query'
import type { FleetData } from '@/types/ops'

export function useFleetData() {
  return useQuery<FleetData>({
    queryKey: ['fleet', 'data'],
    queryFn: async () => {
      const res = await fetch('/api/fleet')
      if (!res.ok) throw new Error('Failed to fetch fleet data')
      return res.json()
    },
    refetchInterval: 10_000, // 10s for real-time tracking
    staleTime: 5_000,
  })
}