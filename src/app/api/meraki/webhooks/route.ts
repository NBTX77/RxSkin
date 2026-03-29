// POST /api/meraki/webhooks — Receive real-time Meraki alert webhooks
// Verifies HMAC-SHA256 signature, logs events, returns 200 immediately.

import { createHmac } from 'crypto'
import { prisma } from '@/lib/db/prisma'
import { resolveTenantId } from '@/lib/instrumentation/tenant-context'
import type { MerakiWebhookPayload } from '@/types/meraki'

export const dynamic = 'force-dynamic'

function verifySignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false
  const expected = createHmac('sha256', secret).update(body).digest('hex')
  // Constant-time comparison
  if (expected.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return diff === 0
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const secret = process.env.MERAKI_WEBHOOK_SECRET

    // Verify signature if secret is configured
    if (secret) {
      const signature = request.headers.get('X-Cisco-Meraki-Alert-Signature')
      if (!verifySignature(rawBody, signature, secret)) {
        return new Response('Unauthorized', { status: 401 })
      }
    }

    let payload: MerakiWebhookPayload
    try {
      payload = JSON.parse(rawBody) as MerakiWebhookPayload
    } catch {
      return new Response('Bad Request', { status: 400 })
    }

    // Log the event to analytics_events (non-blocking)
    const tenantId = await resolveTenantId().catch(() => 'unknown')

    prisma.analyticsEvent.create({
      data: {
        tenantId,
        sessionId: 'webhook',
        eventName: `meraki.${payload.alertTypeId}`,
        eventType: 'meraki_webhook',
        page: '/api/meraki/webhooks',
        component: 'meraki',
        metadata: {
          alertType: payload.alertType,
          alertTypeId: payload.alertTypeId,
          alertLevel: payload.alertLevel,
          organizationId: payload.organizationId,
          organizationName: payload.organizationName,
          networkId: payload.networkId,
          networkName: payload.networkName,
          deviceSerial: payload.deviceSerial,
          deviceName: payload.deviceName,
          deviceModel: payload.deviceModel,
          occurredAt: payload.sentAt,
        },
      },
    }).catch(() => {}) // fire-and-forget

    // Always return 200 — Meraki retries on non-200
    return new Response('OK', { status: 200 })
  } catch {
    // Still return 200 to prevent Meraki retries flooding
    return new Response('OK', { status: 200 })
  }
}
