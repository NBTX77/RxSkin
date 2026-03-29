// ============================================================
// POST /api/feedback/analyze — AI analysis of feedback (admin only)
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import prisma from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST — Analyze unreviewed feedback with AI.
 * Query param `since` (ISO date) filters feedback created after that date.
 * Falls back to a structured mock analysis if no AI API key is configured.
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()
    if (session.user.role !== 'ADMIN') return apiErrors.forbidden()

    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')

    const where: {
      tenantId: string
      adminStatus: string
      createdAt?: { gte: Date }
    } = {
      tenantId: session.user.tenantId,
      adminStatus: 'unreviewed',
    }

    if (since) {
      where.createdAt = { gte: new Date(since) }
    }

    const feedbackItems = await prisma.userFeedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    if (feedbackItems.length === 0) {
      return Response.json({
        analysis: 'No unreviewed feedback to analyze.',
        feedbackCount: 0,
        analyzedAt: new Date().toISOString(),
      })
    }

    // Check if an AI API key is configured
    const aiApiKey = process.env.ANTHROPIC_API_KEY ?? process.env.OPENAI_API_KEY

    if (aiApiKey) {
      // Future: call Claude/OpenAI API with feedback summary prompt
      // For now, fall through to mock analysis until AI integration is wired
    }

    // Build structured mock analysis from the feedback data
    const categoryCounts: Record<string, number> = {}
    const pageCounts: Record<string, number> = {}
    let positiveCount = 0

    for (const item of feedbackItems) {
      categoryCounts[item.category] = (categoryCounts[item.category] ?? 0) + 1
      pageCounts[item.page] = (pageCounts[item.page] ?? 0) + 1
      if (item.rating === 'positive') positiveCount++
    }

    const positiveRatio = feedbackItems.length > 0
      ? Math.round((positiveCount / feedbackItems.length) * 100)
      : 0

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, count]) => `  - ${cat}: ${count} items`)
      .join('\n')

    const topPages = Object.entries(pageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([pg, count]) => `  - ${pg}: ${count} items`)
      .join('\n')

    const recentComments = feedbackItems
      .filter((f) => f.comment)
      .slice(0, 5)
      .map((f) => `  - [${f.category}] "${f.comment}" (${f.rating})`)
      .join('\n')

    const analysis = [
      `Feedback Analysis Summary`,
      `========================`,
      `Total unreviewed items: ${feedbackItems.length}`,
      `Positive ratio: ${positiveRatio}%`,
      ``,
      `Top categories:`,
      topCategories,
      ``,
      `Most mentioned pages:`,
      topPages,
      ``,
      `Recent comments:`,
      recentComments || '  (no comments provided)',
      ``,
      `Note: Connect an AI provider in Admin > AI & Bots for deeper analysis.`,
    ].join('\n')

    return Response.json({
      analysis,
      feedbackCount: feedbackItems.length,
      analyzedAt: new Date().toISOString(),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
