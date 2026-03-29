// ============================================================
// SmileBack Webhook Receiver — RX Skin
// Receives CSAT/NPS survey responses from SmileBack webhooks.
// Validates secret, normalizes payload, stores in SurveyResponse table.
// ============================================================

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { resolveTenantId } from '@/lib/instrumentation/tenant-context'

interface SmileBackCSATPayload {
  event: 'CSAT_received' | 'PRJ_received'
  ticketId?: number
  ticketTitle?: string
  rating?: 'Positive' | 'Neutral' | 'Negative'
  comment?: string
  company?: string
  contact?: string
  contactEmail?: string
  agents?: string
  segment?: string
  permalink?: string
}

interface SmileBackNPSPayload {
  event: 'NPS_received'
  score?: number
  comment?: string
  company?: string
  contact?: string
  contactEmail?: string
  segment?: string
}

type SmileBackPayload = SmileBackCSATPayload | SmileBackNPSPayload

function isNPSPayload(payload: SmileBackPayload): payload is SmileBackNPSPayload {
  return payload.event === 'NPS_received'
}

export async function POST(request: NextRequest) {
  // Validate webhook secret
  const secret = request.headers.get('x-smileback-secret')
  const expectedSecret = process.env.SMILEBACK_WEBHOOK_SECRET

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const payload = (await request.json()) as SmileBackPayload
    const tenantId = await resolveTenantId()

    if (isNPSPayload(payload)) {
      // NPS survey response
      await prisma.surveyResponse.create({
        data: {
          tenantId,
          type: 'NPS',
          score: payload.score ?? null,
          comment: payload.comment ?? null,
          company: payload.company ?? '',
          contact: payload.contact ?? '',
          contactEmail: payload.contactEmail ?? '',
          segment: payload.segment ?? null,
        },
      })
    } else {
      // CSAT or PRJ survey response
      await prisma.surveyResponse.create({
        data: {
          tenantId,
          type: payload.event === 'PRJ_received' ? 'CSAT' : 'CSAT',
          ticketId: payload.ticketId ?? null,
          ticketTitle: payload.ticketTitle ?? null,
          rating: payload.rating ?? null,
          comment: payload.comment ?? null,
          company: payload.company ?? '',
          contact: payload.contact ?? '',
          contactEmail: payload.contactEmail ?? '',
          agents: payload.agents ?? null,
          segment: payload.segment ?? null,
          permalink: payload.permalink ?? null,
        },
      })
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[smileback-webhook] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
