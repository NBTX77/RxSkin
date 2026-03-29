'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UserFeedback, FeedbackAdminStatus, FeedbackCategory } from '@/types/feedback'

// ── Types ─────────────────────────────────────────────────────

interface FeedbackListFilters {
  status?: FeedbackAdminStatus | 'all'
  category?: FeedbackCategory | 'all'
  page?: string
  search?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

interface FeedbackListResponse {
  data: UserFeedback[]
  total: number
}

interface FeedbackUpdatePayload {
  id: string
  adminStatus?: FeedbackAdminStatus
  adminNotes?: string
  linkedTaskUrl?: string
}

interface FeedbackAnalysisResponse {
  analysis: string
  feedbackCount: number
  analyzedAt: string
}

interface FeedbackSettingsResponse {
  feedbackEnabled: boolean
}

// ── Feedback List ─────────────────────────────────────────────

export function useFeedbackList(filters: FeedbackListFilters = {}) {
  const params = new URLSearchParams()
  if (filters.status && filters.status !== 'all') params.set('status', filters.status)
  if (filters.category && filters.category !== 'all') params.set('category', filters.category)
  if (filters.page) params.set('page', filters.page)
  if (filters.search) params.set('search', filters.search)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.offset) params.set('offset', String(filters.offset))

  const qs = params.toString()

  return useQuery<FeedbackListResponse>({
    queryKey: ['feedback', filters],
    queryFn: async () => {
      const res = await fetch(`/api/feedback${qs ? `?${qs}` : ''}`)
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? 'Failed to fetch feedback')
      }
      return res.json()
    },
    staleTime: 30 * 1000,
  })
}

// ── Feedback Update ───────────────────────────────────────────

export function useFeedbackUpdate() {
  const queryClient = useQueryClient()

  return useMutation<UserFeedback, Error, FeedbackUpdatePayload>({
    mutationFn: async ({ id, ...body }) => {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message ?? 'Failed to update feedback')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] })
    },
  })
}

// ── Feedback AI Analysis ──────────────────────────────────────

export function useFeedbackAnalyze() {
  return useMutation<FeedbackAnalysisResponse, Error, void>({
    mutationFn: async () => {
      const res = await fetch('/api/feedback/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message ?? 'Failed to analyze feedback')
      }
      return res.json()
    },
  })
}

// ── Feedback Settings ─────────────────────────────────────────

export function useFeedbackSettings() {
  return useQuery<FeedbackSettingsResponse>({
    queryKey: ['feedback-settings'],
    queryFn: async () => {
      const res = await fetch('/api/feedback/settings')
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? 'Failed to fetch feedback settings')
      }
      return res.json()
    },
    staleTime: 60 * 1000,
  })
}

// ── Feedback Settings Update ──────────────────────────────────

export function useFeedbackSettingsUpdate() {
  const queryClient = useQueryClient()

  return useMutation<FeedbackSettingsResponse, Error, Partial<FeedbackSettingsResponse>>({
    mutationFn: async (body) => {
      const res = await fetch('/api/feedback/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message ?? 'Failed to update feedback settings')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-settings'] })
    },
  })
}
