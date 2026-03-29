'use client'

import { useQuery } from '@tanstack/react-query'
import type { FleetData, FleetTrailPoint } from '@/types/ops'

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

export function useFleetTrails(vehicleId: string | null) {
  return useQuery<FleetTrailPoint[]>({
    queryKey: ['fleet-trails', vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/fleet/trails?vehicleId=${vehicleId}`)
      if (!res.ok) throw new Error('Failed to fetch trails')
      const data: { trails?: { points: FleetTrailPoint[] }[]; locations?: FleetTrailPoint[] } = await res.json()
      if (data.trails && data.trails.length > 0) {
        return data.trails[0].points
      }
      return data.locations || []
    },
    enabled: !!vehicleId,
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000,
  })
}
