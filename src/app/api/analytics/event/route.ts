// ============================================================
// POST /api/analytics/event — Ingest frontend analytics events
// Receives batched events from the client-side tracker.
// Writes to analytics_events table + updates ui_components registry.
// ============================================================

import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db/prisma'
import { getDefaultTenantId } from '@/lib/instrumentation/tenant-context'

export const dynamic = 'force-dynamic'

interface IncomingEvent {
  eventType: string
  eventName: string
  page?: string
  component?: string
  metadata?: Record<string, unknown>
}

interface EventBatch {
  sessionId: string
  viewport?: string
  userAgent?: string
  events: IncomingEvent[]
}

export async function POST(request: Request) {
  try {
    // Auth is optional for analytics — we still log events from unauthenticated pages
    const session = await auth().catch(() => null)
    const userId = session?.user?.id
    const department = session?.user?.department

    const body = (await request.json()) as EventBatch

    if (!body.sessionId || !Array.isArray(body.events) || body.events.length === 0) {
      return Response.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
    }

    // Cap batch size to prevent abuse
    const events = body.events.slice(0, 50)

    const tenantId = await getDefaultTenantId()

    // Bulk insert events (fire and forget — respond immediately)
    const insertPromise = prisma.analyticsEvent.createMany({
      data: events.map((e) => ({
        tenantId,
        userId: userId ?? null,
        sessionId: body.sessionId,
        eventType: e.eventType,
        eventName: e.eventName,
        page: e.page ?? null,
        component: e.component ?? null,
        metadata: e.metadata ?? {},
        department: department ?? null,
        viewport: body.viewport ?? null,
        userAgent: body.userAgent?.slice(0, 500) ?? null,
      })),
    })

    // Update UI Component Registry for performance events
    const perfEvents = events.filter(
      (e) => e.eventType === 'performance' && e.component
    )
    const errorEvents = events.filter(
      (e) => e.eventType === 'error' && e.component
    )

    const registryPromises: Promise<unknown>[] = []

    // Update render counts and avg render time for tracked components
    for (const evt of perfEvents) {
      if (!evt.component) continue
      const renderTimeMs = (evt.metadata as { renderTimeMs?: number })?.renderTimeMs
      const pagePath = evt.page ?? '/'

      registryPromises.push(
        prisma.uiComponent
          .upsert({
            where: {
              tenantId_componentName_pagePath: {
                tenantId,
                componentName: evt.component,
                pagePath,
              },
            },
            update: {
              renderCount: { increment: 1 },
              lastRenderAt: new Date(),
              avgRenderTimeMs: renderTimeMs ?? undefined,
              metadata: (evt.metadata ?? {}) as object,
            },
            create: {
              tenantId,
              componentName: evt.component,
              pagePath,
              renderCount: 1,
              avgRenderTimeMs: renderTimeMs ?? null,
              lastRenderAt: new Date(),
              metadata: (evt.metadata ?? {}) as object,
            },
          })
          .catch((err: Error) =>
            console.error('[analytics] UI registry update failed:', err?.message)
          )
      )
    }

    // Update error counts for tracked components
    for (const evt of errorEvents) {
      if (!evt.component) continue
      const pagePath = evt.page ?? '/'
      const errorMsg = (evt.metadata as { errorMessage?: string })?.errorMessage

      registryPromises.push(
        prisma.uiComponent
          .upsert({
            where: {
              tenantId_componentName_pagePath: {
                tenantId,
                componentName: evt.component,
                pagePath,
              },
            },
            update: {
              errorCount: { increment: 1 },
              lastErrorAt: new Date(),
              lastErrorMessage: errorMsg?.slice(0, 500) ?? null,
            },
            create: {
              tenantId,
              componentName: evt.component,
              pagePath,
              errorCount: 1,
              lastErrorAt: new Date(),
              lastErrorMessage: errorMsg?.slice(0, 500) ?? null,
            },
          })
          .catch((err: Error) =>
            console.error('[analytics] UI error registry update failed:', err?.message)
          )
      )
    }

    // Don't await — respond immediately
    Promise.all([insertPromise, ...registryPromises]).catch((err) =>
      console.error('[analytics] Batch write failed:', err?.message)
    )

    return Response.json({ ok: true, received: events.length })
  } catch (error) {
    console.error('[analytics] Event ingestion error:', error)
    return Response.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
