// ============================================================
// POST /api/feedback — Submit new user feedback
// GET  /api/feedback — List feedback (admin only)
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getDefaultTenantId } from '@/lib/instrumentation/tenant-context'
import prisma from '@/lib/db/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const submitFeedbackSchema = z.object({
  rating: z.enum(['positive', 'negative']),
  category: z.enum(['bug', 'feature_request', 'ux_issue', 'performance', 'other']),
  comment: z.string().max(2000).optional(),
  screenshotUrl: z.string().max(700000).optional(),
  page: z.string().min(1).max(500),
  component: z.string().max(200).optional(),
  featureLabel: z.string().max(200).optional(),
  viewport: z.string().max(100).optional(),
  department: z.string().max(10).optional(),
  sessionId: z.string().max(200).optional(),
  userAgent: z.string().max(1000).optional(),
})

/**
 * POST — Submit new feedback.
 * Auth preferred but optional (allows anonymous feedback).
 */
export async function POST(request: Request) {
  try {
    const session = await auth().catch(() => null)

    const body = await request.json()
    const parsed = submitFeedbackSchema.safeParse(body)
    if (!parsed.success) {
      return apiErrors.badRequest(
        parsed.error.issues.map((i) => i.message).join(', ')
      )
    }

    const tenantId = session?.user?.tenantId ?? (await getDefaultTenantId())

    const feedback = await prisma.userFeedback.create({
      data: {
        tenantId,
        userId: session?.user?.id ?? null,
        sessionId: parsed.data.sessionId || 'anonymous',
        rating: parsed.data.rating,
        category: parsed.data.category,
        comment: parsed.data.comment ?? null,
        screenshotUrl: parsed.data.screenshotUrl ?? null,
        page: parsed.data.page,
        component: parsed.data.component ?? null,
        featureLabel: parsed.data.featureLabel ?? null,
        viewport: parsed.data.viewport ?? null,
        department: parsed.data.department ?? null,
        userAgent: parsed.data.userAgent ?? null,
      },
    })

    return Response.json({ ok: true, id: feedback.id }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET — List feedback (admin only).
 * Query params: status, category, page, from, to, search, limit, offset
 */
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()
    if (session.user.role !== 'ADMIN') return apiErrors.forbidden()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const page = searchParams.get('page')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const search = searchParams.get('search')
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0)

    const tenantId = session.user.tenantId

    // Build Prisma where clause with optional filters
    const where: {
      tenantId: string
      adminStatus?: string
      category?: string
      page?: { contains: string; mode: 'insensitive' }
      comment?: { contains: string; mode: 'insensitive' }
      createdAt?: { gte?: Date; lte?: Date }
    } = { tenantId }

    if (status) {
      where.adminStatus = status
    }
    if (category) {
      where.category = category
    }
    if (page) {
      where.page = { contains: page, mode: 'insensitive' }
    }
    if (search) {
      where.comment = { contains: search, mode: 'insensitive' }
    }
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const [data, total] = await Promise.all([
      prisma.userFeedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.userFeedback.count({ where }),
    ])

    return Response.json({ data, total })
  } catch (error) {
    return handleApiError(error)
  }
}
