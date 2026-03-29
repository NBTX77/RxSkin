// ============================================================
// GET /api/smileback/company — CSAT/NPS scores grouped by company
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { smileBackClient } from '@/lib/smileback/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    // If SmileBack is not configured, return empty array
    if (!smileBackClient.isConfigured()) {
      return Response.json({ companies: [] })
    }

    const { searchParams } = new URL(request.url)

    // Default date range: last 90 days
    const now = new Date()
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const dateFrom = searchParams.get('dateFrom') ?? ninetyDaysAgo.toISOString().split('T')[0]
    const dateTo = searchParams.get('dateTo') ?? now.toISOString().split('T')[0]

    const companies = await smileBackClient.getCSATByCompany({ dateFrom, dateTo })
    return Response.json({ companies })
  } catch (error) {
    return handleApiError(error)
  }
}
