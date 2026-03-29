// GET /api/cbr/[clientId] — Client overview for CBR dashboard

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/config'
import {
  getScalePadCredentials,
  getClientHardwareAssets,
  getClientHardwareLifecycles,
  getClientSaaSAssets,
  getClientOpportunities,
  getClientContracts,
  getClientInitiatives,
} from '@/lib/scalepad/client'
import { computeClientHealthScore } from '@/lib/scalepad/health-score'
import { apiErrors, handleApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { clientId } = await params
    if (!clientId) return apiErrors.badRequest('clientId is required')

    const creds = getScalePadCredentials()

    const [
      hardwareResult,
      lifecyclesResult,
      saasResult,
      opportunitiesResult,
      contractsResult,
      initiativesResult,
    ] = await Promise.allSettled([
      getClientHardwareAssets(creds, clientId),
      getClientHardwareLifecycles(creds, clientId),
      getClientSaaSAssets(creds, clientId),
      getClientOpportunities(creds, clientId),
      getClientContracts(creds, clientId),
      getClientInitiatives(creds, clientId),
    ])

    // Client functions already normalize — extract settled values
    const hardware = hardwareResult.status === 'fulfilled' ? hardwareResult.value : []
    const lifecycles = lifecyclesResult.status === 'fulfilled' ? lifecyclesResult.value : []
    const saas = saasResult.status === 'fulfilled' ? saasResult.value : []
    const opportunities = opportunitiesResult.status === 'fulfilled' ? opportunitiesResult.value : []
    const contracts = contractsResult.status === 'fulfilled' ? contractsResult.value : []
    const initiatives = initiativesResult.status === 'fulfilled' ? initiativesResult.value : []

    const expiredWarrantyCount = lifecycles.filter((l) => l.isWarrantyExpired === true).length
    const totalCapacity = saas.reduce((sum, s) => sum + s.seatCapacity, 0)
    const totalUtilized = saas.reduce((sum, s) => sum + s.seatUtilized, 0)
    const licenseWastePercent = totalCapacity > 0
      ? Math.round(((totalCapacity - totalUtilized) / totalCapacity) * 100)
      : 0
    const openOpportunities = opportunities.filter((o) => o.isActive).length
    const activeContracts = contracts.filter((c) => c.status === 'ACTIVE' || c.status === 'active').length

    const healthScore = computeClientHealthScore({
      hardware,
      lifecycles,
      saas,
      opportunities,
      contracts,
    })

    const failures: string[] = []
    if (hardwareResult.status === 'rejected') failures.push('hardware')
    if (lifecyclesResult.status === 'rejected') failures.push('lifecycles')
    if (saasResult.status === 'rejected') failures.push('saas')
    if (opportunitiesResult.status === 'rejected') failures.push('opportunities')
    if (contractsResult.status === 'rejected') failures.push('contracts')
    if (initiativesResult.status === 'rejected') failures.push('initiatives')

    if (failures.length > 0) {
      console.warn(`[CBR] Partial failures for client ${clientId}:`, failures)
    }

    return Response.json({
      healthScore,
      hardwareCount: hardware.length,
      expiredWarrantyCount,
      licensesCount: saas.length,
      licenseWastePercent,
      openOpportunities,
      activeContracts,
      initiativesCount: initiatives.length,
      ...(failures.length > 0 ? { partialFailures: failures } : {}),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
