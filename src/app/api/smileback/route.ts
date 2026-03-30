// ============================================================
// GET /api/smileback — CSAT reviews + summary
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { smileBackClient, SmileBackApiError } from '@/lib/smileback/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    // If SmileBack is not configured, return empty data
    if (!smileBackClient.isConfigured()) {
      return Response.json({
        reviews: [],
        summary: {
          totalReviews: 0,
          positive: 0,
          neutral: 0,
          negative: 0,
          csatPercent: 0,
          withComments: 0,
        },
        configured: false,
      })
    }

    const { searchParams } = new URL(request.url)

    // Default date range: last 90 days
    const now = new Date()
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const dateFrom = searchParams.get('dateFrom') ?? ninetyDaysAgo.toISOString().split('T')[0]
    const dateTo = searchParams.get('dateTo') ?? now.toISOString().split('T')[0]
    const company = searchParams.get('company') ?? undefined
    const rating = searchParams.get('rating') ?? undefined
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!, 10) : undefined

    const [reviews, summary] = await Promise.all([
      smileBackClient.getCSATReviews({
        dateFrom,
        dateTo,
        companyId: company,
        rating,
        page,
        pageSize,
      }),
      smileBackClient.getCSATSummary({
        dateFrom,
        dateTo,
        companyId: company,
      }),
    ])

    return Response.json({ reviews, summary, configured: true })
  } catch (error) {
    if (error instanceof SmileBackApiError) {
      console.error('[SmileBack] API error, returning empty data:', error.message)
      return Response.json({
        reviews: [],
        summary: { totalReviews: 0, csatPercent: 0, positive: 0, neutral: 0, negative: 0, withComments: 0 },
        configured: true,
        error: error.message,
      })
    }
    return handleApiError(error)
  }
}
