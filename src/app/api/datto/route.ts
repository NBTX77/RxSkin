// ============================================================
// Datto BFF API — Main Route (Dashboard Summary + Config)
// GET /api/datto — returns dashboard summary
// GET /api/datto?endpoint=devices — returns device list
// GET /api/datto?endpoint=alerts — returns all alerts
// GET /api/datto?endpoint=agents — returns all agents
// GET /api/datto?endpoint=saas — returns SaaS customers
// GET /api/datto?endpoint=saas-apps — returns SaaS applications
// GET /api/datto?endpoint=activity — returns activity log
// GET /api/datto?endpoint=config — returns integration config (enabled, dataMode)
// POST /api/datto — test connection with provided credentials
// ============================================================

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
  getDattoDevices,
  getDattoAlerts,
  getAllDattoAgents,
  getDattoSaaSCustomers,
  getDattoActivityLog,
  testDattoConnection,
  isDattoConfigured,

} from '@/lib/datto/client'
import {
  demoDevices,
  demoAlerts,
  demoAgents,
  demoSaaSCustomers,
  demoSaaSApplications,
  demoActivityLog,
  getDemoDashboardSummary,
} from '@/lib/datto/demo-data'
import type { DattoCredentials, DattoIntegrationConfig, DattoDashboardSummary } from '@/types/datto'

// ── Config State (in-memory for Phase 1, move to DB later) ──

const integrationConfig: DattoIntegrationConfig = {
  enabled: true,
  dataMode: isDattoConfigured() ? 'live' : 'demo',
}

// ── GET Handler ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const endpoint = searchParams.get('endpoint') || 'summary'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const perPage = parseInt(searchParams.get('perPage') || '100', 10)
    const serialNumber = searchParams.get('serialNumber') || undefined

    // Return config
    if (endpoint === 'config') {
      return NextResponse.json({
        enabled: integrationConfig.enabled,
        dataMode: integrationConfig.dataMode,
        isConfigured: isDattoConfigured(),
      })
    }

    // If integration is disabled, return empty
    if (!integrationConfig.enabled) {
      return NextResponse.json({ error: 'Datto integration is disabled' }, { status: 403 })
    }

    const useDemo = integrationConfig.dataMode === 'demo' || !isDattoConfigured()

    // Route to the right data source
    switch (endpoint) {
      case 'summary':
        return NextResponse.json(useDemo ? getDemoDashboardSummary() : await getLiveSummary())

      case 'devices':
        if (useDemo) {
          return NextResponse.json({
            pagination: { page: 1, perPage: 100, totalPages: 1, count: demoDevices.length },
            items: demoDevices,
          })
        }
        return NextResponse.json(await getDattoDevices(undefined, { page, perPage }))

      case 'alerts':
        if (useDemo) {
          const items = serialNumber
            ? demoAlerts.filter(a => a.deviceSerialNumber === serialNumber)
            : demoAlerts
          return NextResponse.json({
            pagination: { page: 1, perPage: 100, totalPages: 1, count: items.length },
            items,
          })
        }
        if (serialNumber) {
          const { getDattoAlerts: getAlerts } = await import('@/lib/datto/client')
          return NextResponse.json(await getAlerts(serialNumber))
        }
        // For live mode without serial, aggregate alerts from all devices
        return NextResponse.json(await aggregateLiveAlerts())

      case 'agents':
        if (useDemo) {
          const items = serialNumber
            ? demoAgents.filter(a => a.deviceSerialNumber === serialNumber)
            : demoAgents
          return NextResponse.json({
            pagination: { page: 1, perPage: 100, totalPages: 1, count: items.length },
            items,
          })
        }
        return NextResponse.json(await getAllDattoAgents(undefined, { page, perPage }))

      case 'saas':
        if (useDemo) {
          return NextResponse.json({
            pagination: { page: 1, perPage: 100, totalPages: 1, count: demoSaaSCustomers.length },
            items: demoSaaSCustomers,
          })
        }
        return NextResponse.json(await getDattoSaaSCustomers(undefined, { page, perPage }))

      case 'saas-apps':
        if (useDemo) {
          return NextResponse.json({ items: demoSaaSApplications })
        }
        // Live: would need to iterate customers; return empty for now
        return NextResponse.json({ items: [] })

      case 'activity':
        if (useDemo) {
          return NextResponse.json({
            pagination: { page: 1, perPage: 100, totalPages: 1, count: demoActivityLog.length },
            items: demoActivityLog,
          })
        }
        return NextResponse.json(await getDattoActivityLog(undefined, { page, perPage }))

      default:
        return NextResponse.json({ error: `Unknown endpoint: ${endpoint}` }, { status: 400 })
    }
  } catch (err) {
    console.error('[Datto API Error]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

// ── POST Handler (test connection + update config) ──────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Test connection
    if (body.action === 'test') {
      const creds: DattoCredentials = {
        baseUrl: body.baseUrl || 'https://api.datto.com/v1',
        publicKey: body.publicKey,
        privateKey: body.privateKey,
      }
      const result = await testDattoConnection(creds)
      return NextResponse.json(result)
    }

    // Update config (enable/disable, data mode)
    if (body.action === 'config') {
      if (typeof body.enabled === 'boolean') integrationConfig.enabled = body.enabled
      if (body.dataMode === 'live' || body.dataMode === 'demo') integrationConfig.dataMode = body.dataMode
      return NextResponse.json({ ok: true, config: integrationConfig })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('[Datto POST Error]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

// ── Helper: Build live summary from API ─────────────────────

async function getLiveSummary(): Promise<DattoDashboardSummary> {
  try {
    const [devicesRes, agentsRes, saasRes] = await Promise.allSettled([
      getDattoDevices(undefined, { page: 1, perPage: 100 }),
      getAllDattoAgents(undefined, { page: 1, perPage: 1 }),
      getDattoSaaSCustomers(undefined, { page: 1, perPage: 100 }),
    ])

    const devices = devicesRes.status === 'fulfilled' ? devicesRes.value.items : []
    const agentCount = agentsRes.status === 'fulfilled' ? agentsRes.value.pagination?.count || 0 : 0
    const saasCustomers = saasRes.status === 'fulfilled' ? saasRes.value.items : []

    const onlineDevices = devices.filter(d => {
      const lastSeen = new Date(d.lastSeenDate).getTime()
      return Date.now() - lastSeen < 3600_000 * 2
    })

    const totalAlerts = devices.reduce((sum, d) => sum + (d.alertCount || 0), 0)

    return {
      bcdr: {
        totalDevices: devices.length,
        onlineDevices: onlineDevices.length,
        offlineDevices: devices.length - onlineDevices.length,
        totalAgents: agentCount,
        activeAlerts: totalAlerts,
        criticalAlerts: 0, // would need per-alert query to determine severity
        warningAlerts: 0,
        totalLocalStorageGB: 0,
        usedLocalStorageGB: 0,
        totalOffsiteStorageGB: 0,
        lastBackupSuccessRate: 0,
        activeVMRestores: 0,
      },
      saas: {
        totalCustomers: saasCustomers.length,
        totalSeats: saasCustomers.reduce((s, c) => s + (c.seatsAvailable || 0), 0),
        protectedSeats: saasCustomers.reduce((s, c) => s + (c.seatsUsed || 0), 0),
        totalApplications: saasCustomers.reduce((s, c) => s + (c.applicationsCount || 0), 0),
        lastBackupDate: null,
        m365Customers: saasCustomers.filter(c => c.saasType === 'microsoft365').length,
        googleCustomers: saasCustomers.filter(c => c.saasType === 'google_workspace').length,
      },
    }
  } catch {
    return getDemoDashboardSummary() // fallback to demo on error
  }
}

// ── Helper: Aggregate alerts across all devices (live) ──────

async function aggregateLiveAlerts() {
  try {
    const devicesRes = await getDattoDevices(undefined, { page: 1, perPage: 100 })
    const devicesWithAlerts = devicesRes.items.filter(d => d.alertCount > 0)

    const alertPromises = devicesWithAlerts.map(d =>
      getDattoAlerts(d.serialNumber).catch(() => ({ items: [] as import('@/types/datto').DattoAlert[], pagination: { page: 1, perPage: 100, totalPages: 1, count: 0 } })),
    )
    const alertResults = await Promise.all(alertPromises)
    const allAlerts = alertResults.flatMap(r => r.items)

    return {
      pagination: { page: 1, perPage: 100, totalPages: 1, count: allAlerts.length },
      items: allAlerts,
    }
  } catch {
    return { pagination: { page: 1, perPage: 100, totalPages: 1, count: 0 }, items: [] }
  }
}
