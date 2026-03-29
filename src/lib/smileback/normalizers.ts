// ============================================================
// SmileBack API Response Normalizers — RX Skin BFF
// Transforms raw SmileBack API responses into typed CSAT/NPS
// models. Aggregation helpers for tech and company scoring.
// ============================================================

import type {
  SmileBackCSATReview,
  SmileBackNPSResponse,
  SmileBackCSATSummary,
  SmileBackNPSSummary,
  SmileBackTechScore,
  SmileBackCompanyScore,
} from './types'

// ── Helpers ────────────────────────────────────────────────────

/** Safely read a string from a raw object. */
function str(raw: Record<string, unknown>, key: string, fallback = ''): string {
  const v = raw[key]
  return typeof v === 'string' ? v : fallback
}

/** Safely read a number from a raw object. */
function num(raw: Record<string, unknown>, key: string, fallback = 0): number {
  const v = raw[key]
  return typeof v === 'number' ? v : fallback
}

/** Safely read a boolean from a raw object. */
function bool(raw: Record<string, unknown>, key: string, fallback = false): boolean {
  const v = raw[key]
  return typeof v === 'boolean' ? v : fallback
}

/** Normalize a rating string to the expected union type. */
function normalizeRating(val: unknown): 'Positive' | 'Neutral' | 'Negative' {
  if (typeof val !== 'string') return 'Neutral'
  const lower = val.toLowerCase()
  if (lower === 'positive' || lower === 'happy' || lower === 'good') return 'Positive'
  if (lower === 'negative' || lower === 'unhappy' || lower === 'bad') return 'Negative'
  return 'Neutral'
}

// ── CSAT Review Normalizer ────────────────────────────────────

/**
 * Maps a raw SmileBack CSAT API response object to a typed SmileBackCSATReview.
 * Handles snake_case → camelCase field mapping with safe defaults.
 */
export function normalizeCSATReview(raw: Record<string, unknown>): SmileBackCSATReview {
  return {
    id: str(raw, 'id') || str(raw, 'review_id') || String(raw.id ?? ''),
    rating: normalizeRating(raw.rating),
    comment: typeof raw.comment === 'string' ? raw.comment : null,
    company: str(raw, 'company') || str(raw, 'company_name'),
    contact: str(raw, 'contact') || str(raw, 'contact_name'),
    contactEmail: str(raw, 'contact_email') || str(raw, 'contactEmail'),
    ticketId: str(raw, 'ticket_id') || str(raw, 'ticketId') || String(raw.ticket_id ?? ''),
    ticketTitle: str(raw, 'ticket_title') || str(raw, 'ticketTitle'),
    ticketAgents: str(raw, 'ticket_agents') || str(raw, 'ticketAgents'),
    ticketSegment: str(raw, 'ticket_segment') || str(raw, 'ticketSegment'),
    permalink: str(raw, 'permalink') || str(raw, 'url'),
    hasMarketingPermission: bool(raw, 'has_marketing_permission') || bool(raw, 'hasMarketingPermission'),
    createdAt: str(raw, 'created_at') || str(raw, 'createdAt') || new Date().toISOString(),
  }
}

// ── NPS Response Normalizer ───────────────────────────────────

/**
 * Maps a raw SmileBack NPS API response object to a typed SmileBackNPSResponse.
 * Handles snake_case → camelCase field mapping with safe defaults.
 */
export function normalizeNPSResponse(raw: Record<string, unknown>): SmileBackNPSResponse {
  return {
    id: str(raw, 'id') || str(raw, 'response_id') || String(raw.id ?? ''),
    score: Math.max(0, Math.min(10, num(raw, 'score'))),
    comment: typeof raw.comment === 'string' ? raw.comment : null,
    company: str(raw, 'company') || str(raw, 'company_name'),
    contact: str(raw, 'contact') || str(raw, 'contact_name'),
    contactEmail: str(raw, 'contact_email') || str(raw, 'contactEmail'),
    campaign: str(raw, 'campaign') || str(raw, 'campaign_name'),
    hasMarketingPermission: bool(raw, 'has_marketing_permission') || bool(raw, 'hasMarketingPermission'),
    createdAt: str(raw, 'created_at') || str(raw, 'createdAt') || new Date().toISOString(),
  }
}

// ── CSAT Summary ──────────────────────────────────────────────

/**
 * Computes aggregate CSAT stats from a list of reviews.
 * csatPercent = (positive / total) * 100, clamped to 0 when no reviews.
 */
export function computeCSATSummary(reviews: SmileBackCSATReview[]): SmileBackCSATSummary {
  const total = reviews.length
  let positive = 0
  let neutral = 0
  let negative = 0
  let withComments = 0

  for (const r of reviews) {
    if (r.rating === 'Positive') positive++
    else if (r.rating === 'Negative') negative++
    else neutral++
    if (r.comment) withComments++
  }

  return {
    totalReviews: total,
    positive,
    neutral,
    negative,
    csatPercent: total > 0 ? Math.round((positive / total) * 10000) / 100 : 0,
    withComments,
  }
}

// ── NPS Summary ───────────────────────────────────────────────

/**
 * Computes aggregate NPS stats from a list of responses.
 * Promoters = 9-10, Passives = 7-8, Detractors = 0-6.
 * npsScore = promoters% - detractors% (range: -100 to 100).
 */
export function computeNPSSummary(responses: SmileBackNPSResponse[]): SmileBackNPSSummary {
  const total = responses.length
  let promoters = 0
  let passives = 0
  let detractors = 0

  for (const r of responses) {
    if (r.score >= 9) promoters++
    else if (r.score >= 7) passives++
    else detractors++
  }

  const npsScore = total > 0
    ? Math.round(((promoters - detractors) / total) * 10000) / 100
    : 0

  return {
    totalResponses: total,
    promoters,
    passives,
    detractors,
    npsScore,
  }
}

// ── Trend Calculation ─────────────────────────────────────────

/**
 * Computes a simple trend direction from two values.
 * If diff > 2, trending up; if diff < -2, trending down; else stable.
 */
export function computeTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  const diff = current - previous
  if (diff > 2) return 'up'
  if (diff < -2) return 'down'
  return 'stable'
}

// ── Group by Tech ─────────────────────────────────────────────

/**
 * Splits comma-separated ticketAgents and aggregates CSAT per tech.
 * Each review is attributed to every agent on the ticket.
 * Sorted by totalReviews descending.
 * recentTrend defaults to 'stable' (needs historical data for real trend).
 */
export function groupByTech(reviews: SmileBackCSATReview[]): SmileBackTechScore[] {
  const techMap = new Map<string, { positive: number; neutral: number; negative: number }>()

  for (const r of reviews) {
    const agents = r.ticketAgents
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a.length > 0)

    for (const agent of agents) {
      const existing = techMap.get(agent) ?? { positive: 0, neutral: 0, negative: 0 }
      if (r.rating === 'Positive') existing.positive++
      else if (r.rating === 'Negative') existing.negative++
      else existing.neutral++
      techMap.set(agent, existing)
    }
  }

  const results: SmileBackTechScore[] = []

  for (const [techName, counts] of Array.from(techMap.entries())) {
    const total = counts.positive + counts.neutral + counts.negative
    results.push({
      techName,
      totalReviews: total,
      positive: counts.positive,
      neutral: counts.neutral,
      negative: counts.negative,
      csatPercent: total > 0 ? Math.round((counts.positive / total) * 10000) / 100 : 0,
      recentTrend: 'stable',
    })
  }

  results.sort((a, b) => b.totalReviews - a.totalReviews)
  return results
}

// ── Group by Company ──────────────────────────────────────────

/**
 * Aggregates CSAT per company, optionally merging NPS data by company name match.
 * Sorted by totalReviews descending.
 * recentTrend defaults to 'stable' (needs historical data for real trend).
 */
export function groupByCompany(
  reviews: SmileBackCSATReview[],
  npsResponses?: SmileBackNPSResponse[],
): SmileBackCompanyScore[] {
  // Build CSAT aggregation per company
  const companyMap = new Map<
    string,
    { positive: number; neutral: number; negative: number; lastDate: string }
  >()

  for (const r of reviews) {
    const name = r.company
    if (!name) continue

    const existing = companyMap.get(name) ?? { positive: 0, neutral: 0, negative: 0, lastDate: '' }
    if (r.rating === 'Positive') existing.positive++
    else if (r.rating === 'Negative') existing.negative++
    else existing.neutral++
    if (r.createdAt > existing.lastDate) existing.lastDate = r.createdAt
    companyMap.set(name, existing)
  }

  // Build NPS lookup by company name
  const npsMap = new Map<string, SmileBackNPSResponse[]>()
  if (npsResponses) {
    for (const n of npsResponses) {
      const name = n.company
      if (!name) continue
      const arr = npsMap.get(name) ?? []
      arr.push(n)
      npsMap.set(name, arr)
    }
  }

  const results: SmileBackCompanyScore[] = []

  for (const [companyName, counts] of Array.from(companyMap.entries())) {
    const total = counts.positive + counts.neutral + counts.negative
    const csatPercent = total > 0
      ? Math.round((counts.positive / total) * 10000) / 100
      : 0

    // Compute company-level NPS if responses exist
    let npsScore: number | null = null
    const companyNps = npsMap.get(companyName)
    if (companyNps && companyNps.length > 0) {
      const npsSummary = computeNPSSummary(companyNps)
      npsScore = npsSummary.npsScore
    }

    results.push({
      companyName,
      csatPercent,
      npsScore,
      totalReviews: total,
      lastReviewDate: counts.lastDate,
      recentTrend: 'stable',
    })
  }

  results.sort((a, b) => b.totalReviews - a.totalReviews)
  return results
}
