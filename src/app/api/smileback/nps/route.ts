// ============================================================
// GET /api/smileback/nps — NPS responses + summary
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
        responses: [],
        summary: {
          totalResponses: 0,
          promoters: 0,
          passives: 0,
          detractors: 0,
          npsScore: 0,
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

    const [responses, summary] = await Promise.all([
      smileBackClient.getNPSResponses({ dateFrom, dateTo }),
      smileBackClient.getNPSSummary({ dateFrom, dateTo }),
    ])

    return Response.json({ responses, summary, configured: true })
  } catch (error) {
    if (error instanceof SmileBackApiError) {
      console.error('[SmileBack] API error, returning empty data:', error.message)
      return Response.json({
        responses: [],
        summary: { totalResponses: 0, promoters: 0, passives: 0, detractors: 0, npsScore: 0 },
        configured: true,
        error: error.message,
      })
    }
    return handleApiError(error)
  }
}
