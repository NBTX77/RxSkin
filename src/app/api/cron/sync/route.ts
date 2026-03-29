// ============================================================
// GET /api/cron/sync — Background cache warming
// Called by Vercel Cron Jobs on a schedule (e.g. every 5 min).
// Fetches fresh data from CW API and writes to DB cache.
// Protected by CRON_SECRET to prevent unauthorized access.
// ============================================================

import { getTenantCredentials } from '@/lib/auth/credentials'
import { getProjects, getCompanies, getTickets } from '@/lib/cw/client'
import { getCachedProjects, getCachedCompanies, recordSyncError } from '@/lib/cache/write-through'
import { getDefaultTenantId } from '@/lib/instrumentation/tenant-context'
import { getMerakiCredentials, isMerakiConfigured } from '@/lib/meraki/credentials'
import { getOrganizations, getDeviceStatuses, getUplinkStatuses } from '@/lib/meraki/client'
import { cachedFetch } from '@/lib/cache/bff-cache'
import prisma from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60s for full sync

/**
 * Verify the cron secret to prevent unauthorized access.
 * Vercel injects this header automatically for cron jobs.
 */
function verifyCronSecret(request: Request): boolean {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  const expected = process.env.CRON_SECRET

  // If no CRON_SECRET is set, allow in development only
  if (!expected) {
    return process.env.NODE_ENV === 'development'
  }

  return secret === expected
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, { status: string; count?: number; error?: string; ms?: number }> = {}

  try {
    const tenantId = await getDefaultTenantId()
    if (tenantId === 'unknown') {
      return Response.json({ ok: false, error: 'No active tenant found' }, { status: 500 })
    }

    const creds = await getTenantCredentials(tenantId)

    // Sync projects
    const projStart = performance.now()
    try {
      const projects = await getCachedProjects(
        tenantId,
        () => getProjects(creds, { closedFlag: false }),
        0 // Force API fetch by setting memory TTL to 0
      )
      results.projects = {
        status: 'success',
        count: projects.length,
        ms: Math.round(performance.now() - projStart),
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      results.projects = { status: 'error', error: errMsg }
      await recordSyncError(tenantId, 'projects', errMsg)
    }

    // Sync companies
    const compStart = performance.now()
    try {
      const companies = await getCachedCompanies(
        tenantId,
        () => getCompanies(creds),
        0
      )
      results.companies = {
        status: 'success',
        count: companies.length,
        ms: Math.round(performance.now() - compStart),
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      results.companies = { status: 'error', error: errMsg }
      await recordSyncError(tenantId, 'companies', errMsg)
    }

    // Sync ticket count (just update sync state — tickets are cached differently)
    const tickStart = performance.now()
    try {
      const tickets = await getTickets(creds, { pageSize: 250 })
      results.tickets = {
        status: 'success',
        count: tickets.length,
        ms: Math.round(performance.now() - tickStart),
      }

      // Update sync state for tickets
      await prisma.cacheSyncState.upsert({
        where: { tenantId_entityType: { tenantId, entityType: 'tickets' } },
        update: {
          lastSyncAt: new Date(),
          recordCount: tickets.length,
          syncDurationMs: Math.round(performance.now() - tickStart),
          status: 'success',
          errorMessage: null,
        },
        create: {
          tenantId,
          entityType: 'tickets',
          lastSyncAt: new Date(),
          recordCount: tickets.length,
          syncDurationMs: Math.round(performance.now() - tickStart),
          status: 'success',
        },
      })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      results.tickets = { status: 'error', error: errMsg }
      await recordSyncError(tenantId, 'tickets', errMsg)
    }

    // Sync Meraki (if configured)
    if (isMerakiConfigured()) {
      const merakiStart = performance.now()
      try {
        const merakiCreds = getMerakiCredentials()!
        const orgs = await cachedFetch('meraki:organizations', () => getOrganizations(merakiCreds), 3600_000)

        let deviceCount = 0
        for (const org of orgs) {
          const [devices, uplinks] = await Promise.allSettled([
            cachedFetch(`meraki:devices:${org.id}`, () => getDeviceStatuses(merakiCreds, org.id), 300_000),
            cachedFetch(`meraki:uplinks:${org.id}`, () => getUplinkStatuses(merakiCreds, org.id), 300_000),
          ])
          if (devices.status === 'fulfilled') deviceCount += devices.value.length
          void uplinks
        }

        results.meraki = {
          status: 'success',
          count: deviceCount,
          ms: Math.round(performance.now() - merakiStart),
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        results.meraki = { status: 'error', error: errMsg }
      }
    }

    const allOk = Object.values(results).every((r) => r.status === 'success')

    return Response.json({
      ok: allOk,
      syncedAt: new Date().toISOString(),
      results,
    })
  } catch (error) {
    console.error('[cron/sync] Fatal error:', error)
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
