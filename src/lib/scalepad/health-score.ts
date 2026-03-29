// ============================================================
// Client Health Score Engine — CBR Dashboard
// Computes a 0-100 health score across hardware, software,
// contracts, and opportunities for each client.
// ============================================================

import type {
  CBRHardwareAsset,
  CBRHardwareLifecycle,
  CBRSaaSAsset,
  CBROpportunity,
  CBRContract,
  ClientHealthScore,
  HealthFactor,
} from '@/types/cbr'

// ── Weight Configuration ───────────────────────────────────────

const WEIGHTS = {
  warrantyCovarage: 0.15,
  avCoverage: 0.15,
  licenseUtilization: 0.25,
  contractHealth: 0.20,
  opportunityHealth: 0.25,
} as const

// ── Input Type ─────────────────────────────────────────────────

export interface HealthScoreInput {
  hardware: CBRHardwareAsset[]
  lifecycles: CBRHardwareLifecycle[]
  saas: CBRSaaSAsset[]
  opportunities: CBROpportunity[]
  contracts: CBRContract[]
}

// ── Core Computation ───────────────────────────────────────────

/**
 * Compute a comprehensive client health score from ScalePad data.
 *
 * Scoring dimensions:
 * - Hardware Health (30%): warranty coverage (15%) + AV coverage (15%)
 * - Software Health (25%): license utilization (seat waste)
 * - Contract Health (20%): active agreements ratio
 * - Opportunity Health (25%): open opportunities (fewer = healthier, client is well-served)
 */
export function computeClientHealthScore(data: HealthScoreInput): ClientHealthScore {
  const factors: HealthFactor[] = []

  // ── Hardware: Warranty Coverage (15%) ──────────────────────
  const warrantyScore = computeWarrantyCoverage(data.lifecycles, factors)

  // ── Hardware: AV Coverage (15%) ────────────────────────────
  const avScore = computeAVCoverage(data.hardware, factors)

  // ── Software: License Utilization (25%) ────────────────────
  const licenseScore = computeLicenseUtilization(data.saas, factors)

  // ── Contract Health (20%) ──────────────────────────────────
  const contractScore = computeContractHealth(data.contracts, factors)

  // ── Opportunity Health (25%) ───────────────────────────────
  const opportunityScore = computeOpportunityHealth(data.opportunities, factors)

  // ── Aggregate ──────────────────────────────────────────────
  const hardwareComposite = Math.round(
    (warrantyScore * WEIGHTS.warrantyCovarage + avScore * WEIGHTS.avCoverage) /
    (WEIGHTS.warrantyCovarage + WEIGHTS.avCoverage)
  )

  const overall = Math.round(
    warrantyScore * WEIGHTS.warrantyCovarage +
    avScore * WEIGHTS.avCoverage +
    licenseScore * WEIGHTS.licenseUtilization +
    contractScore * WEIGHTS.contractHealth +
    opportunityScore * WEIGHTS.opportunityHealth
  )

  const clampedOverall = Math.max(0, Math.min(100, overall))

  return {
    overall: clampedOverall,
    hardware: hardwareComposite,
    software: licenseScore,
    contracts: contractScore,
    opportunities: opportunityScore,
    grade: scoreToGrade(clampedOverall),
    color: scoreToColor(clampedOverall),
    factors,
  }
}

// ── Dimension Calculators ──────────────────────────────────────

function computeWarrantyCoverage(
  lifecycles: CBRHardwareLifecycle[],
  factors: HealthFactor[]
): number {
  if (lifecycles.length === 0) {
    factors.push({
      category: 'Hardware',
      label: 'Warranty Coverage',
      score: 50,
      weight: WEIGHTS.warrantyCovarage,
      detail: 'No hardware lifecycle data available',
      actionable: false,
    })
    return 50 // Neutral when no data
  }

  const withWarranty = lifecycles.filter((l) => l.warrantyExpiryDate != null)
  const expired = withWarranty.filter((l) => l.isWarrantyExpired === true)
  const expiringSoon = withWarranty.filter(
    (l) => l.warrantyDaysRemaining != null && l.warrantyDaysRemaining > 0 && l.warrantyDaysRemaining <= 90
  )

  const coveredCount = withWarranty.length - expired.length
  const coverageRatio = withWarranty.length > 0 ? coveredCount / withWarranty.length : 0
  const score = Math.round(coverageRatio * 100)

  factors.push({
    category: 'Hardware',
    label: 'Warranty Coverage',
    score,
    weight: WEIGHTS.warrantyCovarage,
    detail: `${coveredCount}/${withWarranty.length} devices under warranty (${expired.length} expired, ${expiringSoon.length} expiring within 90 days)`,
    actionable: expired.length > 0 || expiringSoon.length > 0,
    recommendation: expired.length > 0
      ? `Renew or replace ${expired.length} device(s) with expired warranty`
      : expiringSoon.length > 0
        ? `${expiringSoon.length} warranty(ies) expiring soon — schedule renewal`
        : undefined,
  })

  return score
}

function computeAVCoverage(
  hardware: CBRHardwareAsset[],
  factors: HealthFactor[]
): number {
  if (hardware.length === 0) {
    factors.push({
      category: 'Hardware',
      label: 'AV Coverage',
      score: 50,
      weight: WEIGHTS.avCoverage,
      detail: 'No hardware asset data available',
      actionable: false,
    })
    return 50
  }

  // Count devices with active AV
  const withAV = hardware.filter((h) => {
    const status = h.avStatus?.toLowerCase()
    return status && status !== 'none' && status !== 'unknown' && status !== 'not installed'
  })

  const coverageRatio = withAV.length / hardware.length
  const score = Math.round(coverageRatio * 100)
  const uncovered = hardware.length - withAV.length

  factors.push({
    category: 'Hardware',
    label: 'AV Coverage',
    score,
    weight: WEIGHTS.avCoverage,
    detail: `${withAV.length}/${hardware.length} devices have active antivirus`,
    actionable: uncovered > 0,
    recommendation: uncovered > 0
      ? `Deploy antivirus to ${uncovered} unprotected device(s)`
      : undefined,
  })

  return score
}

function computeLicenseUtilization(
  saas: CBRSaaSAsset[],
  factors: HealthFactor[]
): number {
  if (saas.length === 0) {
    factors.push({
      category: 'Software',
      label: 'License Utilization',
      score: 50,
      weight: WEIGHTS.licenseUtilization,
      detail: 'No SaaS license data available',
      actionable: false,
    })
    return 50
  }

  const totalCapacity = saas.reduce((sum, s) => sum + s.seatCapacity, 0)
  const totalUtilized = saas.reduce((sum, s) => sum + s.seatUtilized, 0)
  const totalWaste = saas.reduce((sum, s) => sum + s.seatWaste, 0)

  const utilizationRatio = totalCapacity > 0 ? totalUtilized / totalCapacity : 0
  const score = Math.round(utilizationRatio * 100)
  const wastePercent = totalCapacity > 0 ? Math.round((totalWaste / totalCapacity) * 100) : 0

  const highWasteProducts = saas
    .filter((s) => s.wastePercent > 30)
    .sort((a, b) => b.wastePercent - a.wastePercent)

  factors.push({
    category: 'Software',
    label: 'License Utilization',
    score,
    weight: WEIGHTS.licenseUtilization,
    detail: `${totalUtilized}/${totalCapacity} seats utilized across ${saas.length} products (${wastePercent}% waste)`,
    actionable: wastePercent > 15,
    recommendation: highWasteProducts.length > 0
      ? `Optimize ${highWasteProducts.length} product(s) with >30% seat waste: ${highWasteProducts.slice(0, 3).map((p) => p.productName ?? 'Unknown').join(', ')}`
      : undefined,
  })

  return score
}

function computeContractHealth(
  contracts: CBRContract[],
  factors: HealthFactor[]
): number {
  if (contracts.length === 0) {
    factors.push({
      category: 'Contracts',
      label: 'Active Agreements',
      score: 0,
      weight: WEIGHTS.contractHealth,
      detail: 'No contracts on file — client has no active agreements',
      actionable: true,
      recommendation: 'Set up managed service or support agreements for this client',
    })
    return 0
  }

  const active = contracts.filter((c) => {
    const status = c.status?.toLowerCase()
    return status === 'active' || status === 'current' || !status
  })

  const expiringSoon = active.filter((c) => {
    if (!c.endsAt) return false
    const endDate = new Date(c.endsAt)
    const now = new Date()
    const daysUntilEnd = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilEnd > 0 && daysUntilEnd <= 60
  })

  const activeRatio = active.length / contracts.length
  // Bonus: recurring contracts are more stable
  const recurringCount = active.filter((c) => c.isRecurring).length
  const recurringBonus = active.length > 0 ? (recurringCount / active.length) * 10 : 0

  const score = Math.min(100, Math.round(activeRatio * 90 + recurringBonus))

  factors.push({
    category: 'Contracts',
    label: 'Active Agreements',
    score,
    weight: WEIGHTS.contractHealth,
    detail: `${active.length}/${contracts.length} contracts active (${recurringCount} recurring, ${expiringSoon.length} expiring within 60 days)`,
    actionable: expiringSoon.length > 0 || active.length < contracts.length,
    recommendation: expiringSoon.length > 0
      ? `${expiringSoon.length} contract(s) expiring within 60 days — initiate renewal`
      : active.length < contracts.length
        ? `${contracts.length - active.length} inactive contract(s) — review for renewal or cleanup`
        : undefined,
  })

  return score
}

function computeOpportunityHealth(
  opportunities: CBROpportunity[],
  factors: HealthFactor[]
): number {
  if (opportunities.length === 0) {
    // No open opportunities — client is well-served
    factors.push({
      category: 'Opportunities',
      label: 'Open Opportunities',
      score: 100,
      weight: WEIGHTS.opportunityHealth,
      detail: 'No open opportunities — client infrastructure is well-covered',
      actionable: false,
    })
    return 100
  }

  const active = opportunities.filter((o) => o.isActive)

  // More open opportunities = lower score (more gaps to address)
  // Scale: 0 open = 100, 1-2 = 80, 3-5 = 60, 6-10 = 40, 10+ = 20
  let score: number
  if (active.length === 0) {
    score = 100
  } else if (active.length <= 2) {
    score = 80
  } else if (active.length <= 5) {
    score = 60
  } else if (active.length <= 10) {
    score = 40
  } else {
    score = 20
  }

  factors.push({
    category: 'Opportunities',
    label: 'Open Opportunities',
    score,
    weight: WEIGHTS.opportunityHealth,
    detail: `${active.length} active opportunit${active.length === 1 ? 'y' : 'ies'} (${opportunities.length} total)`,
    actionable: active.length > 0,
    recommendation: active.length > 0
      ? `${active.length} open opportunit${active.length === 1 ? 'y' : 'ies'} — prioritize and close gaps in client coverage`
      : undefined,
  })

  return score
}

// ── Grade / Color Mapping ──────────────────────────────────────

function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

function scoreToColor(score: number): 'green' | 'yellow' | 'orange' | 'red' {
  if (score >= 80) return 'green'
  if (score >= 65) return 'yellow'
  if (score >= 45) return 'orange'
  return 'red'
}
