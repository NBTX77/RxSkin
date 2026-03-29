'use client'

import { useQuery } from '@tanstack/react-query'
import type {
  CBRClient,
  CBRClientOverview,
  CBRHardwareAsset,
  CBRHardwareLifecycle,
  CBRSaaSAsset,
  CBROpportunity,
  CBRContract,
  CBRInitiative,
  CBRActionItem,
} from '@/types/cbr'

// ── Client List ────────────────────────────────────────────────

export function useCBRClients() {
  return useQuery<{ clients: CBRClient[] }>({
    queryKey: ['cbr-clients'],
    queryFn: async () => {
      const res = await fetch('/api/cbr/clients')
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? 'Failed to fetch CBR clients')
      }
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ── Client Overview (with health score) ────────────────────────

export function useCBRClientOverview(clientId: string) {
  return useQuery<CBRClientOverview>({
    queryKey: ['cbr-overview', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/cbr/${clientId}`)
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? 'Failed to fetch client overview')
      }
      return res.json()
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
  })
}

// ── Hardware (assets + lifecycles) ─────────────────────────────

export function useCBRHardware(clientId: string) {
  return useQuery<{ assets: CBRHardwareAsset[]; lifecycles: CBRHardwareLifecycle[] }>({
    queryKey: ['cbr-hardware', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/cbr/${clientId}/hardware`)
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? 'Failed to fetch hardware data')
      }
      return res.json()
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  })
}

// ── Licenses (SaaS assets) ────────────────────────────────────

export function useCBRLicenses(clientId: string) {
  return useQuery<{ licenses: CBRSaaSAsset[] }>({
    queryKey: ['cbr-licenses', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/cbr/${clientId}/licenses`)
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? 'Failed to fetch license data')
      }
      return res.json()
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  })
}

// ── Opportunities ──────────────────────────────────────────────

export function useCBROpportunities(clientId: string) {
  return useQuery<{ opportunities: CBROpportunity[] }>({
    queryKey: ['cbr-opportunities', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/cbr/${clientId}/opportunities`)
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? 'Failed to fetch opportunities')
      }
      return res.json()
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  })
}

// ── Contracts ──────────────────────────────────────────────────

export function useCBRContracts(clientId: string) {
  return useQuery<{ contracts: CBRContract[] }>({
    queryKey: ['cbr-contracts', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/cbr/${clientId}/contracts`)
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? 'Failed to fetch contracts')
      }
      return res.json()
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  })
}

// ── Initiatives ────────────────────────────────────────────────

export function useCBRInitiatives(clientId: string) {
  return useQuery<{ initiatives: CBRInitiative[] }>({
    queryKey: ['cbr-initiatives', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/cbr/${clientId}/initiatives`)
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? 'Failed to fetch initiatives')
      }
      return res.json()
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  })
}

// ── Action Items ───────────────────────────────────────────────

export function useCBRActionItems(clientId: string) {
  return useQuery<{ actionItems: CBRActionItem[] }>({
    queryKey: ['cbr-action-items', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/cbr/${clientId}/action-items`)
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? 'Failed to fetch action items')
      }
      return res.json()
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  })
}
