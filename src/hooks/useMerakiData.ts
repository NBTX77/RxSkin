'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  MerakiOrganization,
  MerakiDeviceStatus,
  MerakiNetworkSummary,
  MerakiNetwork,
  MerakiAlert,
  MerakiUplinkStatus,
  MerakiLicenseOverview,
  MerakiClient,
  MerakiSSID,
  MerakiDashboardOverview,
} from '@/types/meraki'

// ── Generic fetch helper ────────────────────────────────────

interface MerakiResponse<T> {
  ok: boolean
  data: T
  demo?: boolean
}

async function merakiFetch<T>(path: string): Promise<MerakiResponse<T>> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Meraki API error: ${res.status}`)
  return res.json()
}

// ── Dashboard Overview ──────────────────────────────────────

export function useMerakiOverview() {
  return useQuery({
    queryKey: ['meraki', 'overview'],
    queryFn: () => merakiFetch<MerakiDashboardOverview>('/api/meraki/overview'),
    refetchInterval: 300_000, // 5 min
    staleTime: 120_000,
  })
}

// ── Organizations ───────────────────────────────────────────

export function useMerakiOrganizations() {
  return useQuery({
    queryKey: ['meraki', 'organizations'],
    queryFn: () => merakiFetch<MerakiOrganization[]>('/api/meraki/organizations'),
    staleTime: 3600_000, // 1 hour
  })
}

// ── Devices ─────────────────────────────────────────────────

export function useMerakiDevices(orgId?: string) {
  return useQuery({
    queryKey: ['meraki', 'devices', orgId],
    queryFn: () => merakiFetch<MerakiDeviceStatus[]>(
      `/api/meraki/devices${orgId ? `?orgId=${orgId}` : ''}`
    ),
    refetchInterval: 300_000,
    staleTime: 120_000,
  })
}

// ── Networks ────────────────────────────────────────────────

export function useMerakiNetworks(orgId?: string) {
  return useQuery({
    queryKey: ['meraki', 'networks', orgId],
    queryFn: () => merakiFetch<MerakiNetworkSummary[] | MerakiNetwork[]>(
      `/api/meraki/networks${orgId ? `?orgId=${orgId}` : ''}`
    ),
    staleTime: 600_000,
  })
}

// ── Alerts ──────────────────────────────────────────────────

export function useMerakiAlerts(orgId?: string) {
  return useQuery({
    queryKey: ['meraki', 'alerts', orgId],
    queryFn: () => merakiFetch<MerakiAlert[]>(
      `/api/meraki/alerts${orgId ? `?orgId=${orgId}` : ''}`
    ),
    refetchInterval: 120_000, // 2 min
    staleTime: 60_000,
  })
}

// ── Uplinks ─────────────────────────────────────────────────

export function useMerakiUplinks(orgId?: string) {
  return useQuery({
    queryKey: ['meraki', 'uplinks', orgId],
    queryFn: () => merakiFetch<MerakiUplinkStatus[]>(
      `/api/meraki/uplinks${orgId ? `?orgId=${orgId}` : ''}`
    ),
    refetchInterval: 300_000,
    staleTime: 120_000,
  })
}

// ── Licensing ───────────────────────────────────────────────

export function useMerakiLicensing(orgId?: string) {
  return useQuery({
    queryKey: ['meraki', 'licensing', orgId],
    queryFn: () => merakiFetch<MerakiLicenseOverview>(
      `/api/meraki/licensing${orgId ? `?orgId=${orgId}` : ''}`
    ),
    staleTime: 86400_000, // 24 hours
  })
}

// ── Clients ─────────────────────────────────────────────────

export function useMerakiClients(networkId?: string) {
  return useQuery({
    queryKey: ['meraki', 'clients', networkId],
    queryFn: () => merakiFetch<MerakiClient[]>(
      `/api/meraki/clients${networkId ? `?networkId=${networkId}` : ''}`
    ),
    enabled: !!networkId || true, // enable for demo mode even without networkId
    staleTime: 300_000,
  })
}

// ── Wireless SSIDs ──────────────────────────────────────────

export function useMerakiSSIDs(networkId?: string) {
  return useQuery({
    queryKey: ['meraki', 'ssids', networkId],
    queryFn: () => merakiFetch<MerakiSSID[]>(
      `/api/meraki/wireless${networkId ? `?networkId=${networkId}` : ''}`
    ),
    enabled: !!networkId || true,
    staleTime: 600_000,
  })
}

// ── Demo Mode ───────────────────────────────────────────────

export function useMerakiDemoMode() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['meraki', 'demo-mode'],
    queryFn: async () => {
      const res = await fetch('/api/meraki/demo-mode')
      if (!res.ok) return { demoMode: false }
      return res.json() as Promise<{ ok: boolean; demoMode: boolean }>
    },
    staleTime: Infinity,
  })

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await fetch('/api/meraki/demo-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      if (!res.ok) throw new Error('Failed to toggle demo mode')
      return res.json()
    },
    onSuccess: () => {
      // Invalidate all meraki queries to refetch with new mode
      queryClient.invalidateQueries({ queryKey: ['meraki'] })
    },
  })

  return {
    isDemoMode: data?.demoMode ?? false,
    isLoading,
    toggle: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
  }
}
