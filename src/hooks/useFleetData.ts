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
    refetchInterval: 30_000, // Auto-refresh every 30s
    staleTime: 15_000,
  })
}