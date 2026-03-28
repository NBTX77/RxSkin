'use client'

import { useQuery } from '@tanstack/react-query'
import type { FleetTrailsResponse } from '@/types/ops'

export function useVehicleTrails() {
  return useQuery<FleetTrailsResponse>({
    queryKey: ['fleet', 'trails'],
    queryFn: async () => {
      const res = await fetch('/api/fleet/trails')
      if (!res.ok) throw new Error('Failed to fetch vehicle trails')
      return res.json()
    },
    refetchInterval: 10_000, // 10s for real-time feel
    staleTime: 5_000,
  })
}
