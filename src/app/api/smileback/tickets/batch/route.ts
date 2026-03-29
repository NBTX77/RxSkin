// ============================================================
// POST /api/smileback/tickets/batch — Batch fetch CSAT surveys for multiple tickets
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { smileBackClient } from '@/lib/smileback/client'
import type { SmileBackTicketSurvey } from '@/lib/smileback/types'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const body = await request.json() as { ticketIds?: unknown }

    // Validate ticketIds
    if (!body.ticketIds || !Array.isArray(body.ticketIds)) {
      return apiErrors.badRequest('ticketIds must be an array of numbers')
    }

    const ticketIds = body.ticketIds as number[]

    if (ticketIds.length === 0) {
      return Response.json({ surveys: {} })
    }

    if (ticketIds.length > 50) {
      return apiErrors.badRequest('Maximum 50 ticket IDs per batch request')
    }

    // Validate each ID is a number
    for (const id of ticketIds) {
      if (typeof id !== 'number' || isNaN(id)) {
        return apiErrors.badRequest('Each ticketId must be a valid number')
      }
    }

    // If SmileBack is not configured, return empty surveys
    if (!smileBackClient.isConfigured()) {
      return Response.json({ surveys: {} })
    }

    // Fetch recent CSAT reviews and filter by the requested ticket IDs
    const now = new Date()
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const reviews = await smileBackClient.getCSATReviews({
      dateFrom: ninetyDaysAgo.toISOString().split('T')[0],
      dateTo: now.toISOString().split('T')[0],
      pageSize: 1000,
    })

    const ticketIdSet = new Set(ticketIds.map(String))
    const surveys: Record<string, SmileBackTicketSurvey> = {}

    for (const review of reviews) {
      if (ticketIdSet.has(review.ticketId)) {
        surveys[review.ticketId] = {
          ticketId: parseInt(review.ticketId, 10),
          rating: review.rating,
          comment: review.comment,
          contact: review.contact,
          createdAt: review.createdAt,
          permalink: review.permalink,
        }
      }
    }

    return Response.json({ surveys })
  } catch (error) {
    return handleApiError(error)
  }
}
