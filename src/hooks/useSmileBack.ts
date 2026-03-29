'use client'

import { useQuery } from '@tanstack/react-query'

function buildParams(params?: Record<string, string | undefined>): string {
  if (!params) return ''
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v) })
  return sp.toString()
}

export function useCSATOverview(params?: { dateFrom?: string; dateTo?: string; company?: string }) {
  return useQuery({
    queryKey: ['smileback', 'csat', params],
    queryFn: async () => {
      const qs = buildParams(params)
      const res = await fetch(`/api/smileback${qs ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch CSAT data')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useNPSOverview(params?: { dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ['smileback', 'nps', params],
    queryFn: async () => {
      const qs = buildParams(params)
      const res = await fetch(`/api/smileback/nps${qs ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch NPS data')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useTicketSurvey(ticketId: number | null) {
  return useQuery({
    queryKey: ['smileback', 'ticket', ticketId],
    queryFn: async () => {
      const res = await fetch(`/api/smileback/ticket/${ticketId}`)
      if (!res.ok) throw new Error('Failed to fetch ticket survey')
      return res.json()
    },
    enabled: !!ticketId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useTechCSAT(params?: { dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ['smileback', 'tech', params],
    queryFn: async () => {
      const qs = buildParams(params)
      const res = await fetch(`/api/smileback/tech${qs ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch tech CSAT')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCompanyCSAT(params?: { dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ['smileback', 'company', params],
    queryFn: async () => {
      const qs = buildParams(params)
      const res = await fetch(`/api/smileback/company${qs ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch company CSAT')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useTicketSurveyBatch(ticketIds: number[]) {
  return useQuery({
    queryKey: ['smileback', 'tickets', 'batch', ticketIds],
    queryFn: async () => {
      const res = await fetch('/api/smileback/tickets/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketIds }),
      })
      if (!res.ok) throw new Error('Failed to fetch ticket surveys')
      return res.json()
    },
    enabled: ticketIds.length > 0,
    staleTime: 10 * 60 * 1000,
  })
}
