// ============================================================
// SmileBack CSAT/NPS API Client — RX Skin BFF Layer
// NEVER import this in client components — server-side only.
// ============================================================

import { logApiCall } from '@/lib/instrumentation/api-logger'
import { resolveTenantId } from '@/lib/instrumentation/tenant-context'
import type {
  SmileBackCSATReview,
  SmileBackNPSResponse,
  SmileBackCSATSummary,
  SmileBackNPSSummary,
  SmileBackTicketSurvey,
  SmileBackTechScore,
  SmileBackCompanyScore,
} from './types'
import {
  normalizeCSATReview,
  normalizeNPSResponse,
  computeCSATSummary,
  computeNPSSummary,
  groupByTech,
  groupByCompany,
} from './normalizers'

// ── Constants ────────────────────────────────────────────────

const SMILEBACK_BASE_URL = 'https://app.smileback.io'
const SMILEBACK_TOKEN_PATH = '/api/v1/auth/token'
const RATE_LIMIT_MAX = 100
const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 1_000

const CACHE_TTL_REVIEWS_MS = 5 * 60 * 1_000   // 5 minutes for reviews
const CACHE_TTL_SUMMARY_MS = 10 * 60 * 1_000  // 10 minutes for summaries
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1_000      // refresh 1 minute before expiry

// ── Error Class ──────────────────────────────────────────────

export class SmileBackApiError extends Error {
  status: number
  retryAfterMs?: number

  constructor(status: number, detail: string, retryAfterMs?: number) {
    super(`SmileBack API error: ${status} — ${detail}`)
    this.name = 'SmileBackApiError'
    this.status = status
    this.retryAfterMs = retryAfterMs
  }
}

// ── In-Memory Cache ──────────────────────────────────────────

interface CacheEntry<T> {
  data: T
  expiry: number
}

const cache = new Map<string, CacheEntry<unknown>>()

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiry) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expiry: Date.now() + ttlMs })
}

function buildCacheKey(prefix: string, params?: Record<string, string | number | undefined>): string {
  const parts = [prefix]
  if (params) {
    const sorted = Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
    if (sorted.length > 0) parts.push(sorted.join('&'))
  }
  return parts.join('?')
}

// ── Rate Limiter ─────────────────────────────────────────────

const requestTimestamps: number[] = []

function checkRateLimit(): void {
  const now = Date.now()
  // Remove timestamps outside the window
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift()
  }
  requestTimestamps.push(now)
}

function isRateLimited(): boolean {
  const now = Date.now()
  const recentCount = requestTimestamps.filter(
    (ts) => ts > now - RATE_LIMIT_WINDOW_MS
  ).length
  return recentCount >= RATE_LIMIT_MAX
}

// ── Sleep Helper ─────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── OAuth2 Token Cache ────────────────────────────────────────

interface OAuthToken {
  accessToken: string
  expiresAt: number // epoch ms
}

let cachedToken: OAuthToken | null = null

async function getAccessToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt - TOKEN_EXPIRY_BUFFER_MS > now) {
    return cachedToken.accessToken
  }

  const clientId = process.env.SMILEBACK_CLIENT_ID ?? ''
  const clientSecret = process.env.SMILEBACK_CLIENT_SECRET ?? ''

  const response = await fetch(`${SMILEBACK_BASE_URL}${SMILEBACK_TOKEN_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new SmileBackApiError(response.status, `Auth failed: ${body}`)
  }

  const data = (await response.json()) as {
    access_token: string
    expires_in?: number
    token_type?: string
  }

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + (data.expires_in ?? 3600) * 1_000,
  }

  return cachedToken.accessToken
}

// ── SmileBack Client ─────────────────────────────────────────

class SmileBackClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = SMILEBACK_BASE_URL
  }

  /**
   * Check whether SmileBack API credentials are configured.
   */
  isConfigured(): boolean {
    return !!(process.env.SMILEBACK_CLIENT_ID && process.env.SMILEBACK_CLIENT_SECRET)
  }

  // ── Core Fetch ───────────────────────────────────────────

  /**
   * Internal fetch wrapper with OAuth2 Bearer auth, rate limiting, retry on 429,
   * and API call instrumentation.
   */
  private async fetchAPI<T>(
    path: string,
    params?: Record<string, string | undefined>
  ): Promise<T> {
    const token = await getAccessToken()

    // Build URL with query params
    const url = new URL(`${this.baseUrl}${path}`)
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, value)
        }
      }
    }

    let lastError: Error | undefined

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (isRateLimited()) {
        const waitMs = RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX
        await sleep(waitMs)
      }

      checkRateLimit()

      try {
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        })

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          const backoffMs = retryAfter
            ? parseInt(retryAfter, 10) * 1_000
            : INITIAL_BACKOFF_MS * Math.pow(2, attempt)

          if (attempt < MAX_RETRIES) {
            await sleep(backoffMs)
            continue
          }

          throw new SmileBackApiError(429, 'Rate limited — retries exhausted', backoffMs)
        }

        if (!response.ok) {
          const body = await response.text()
          throw new SmileBackApiError(response.status, body)
        }

        if (response.status === 204) {
          return [] as T
        }

        return (await response.json()) as T
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))

        if (err instanceof SmileBackApiError && err.status !== 429) {
          throw err
        } else if (!(err instanceof SmileBackApiError)) {
          throw lastError
        }
      }
    }

    throw lastError ?? new SmileBackApiError(429, 'Rate limited — retries exhausted')
  }

  /**
   * Fetch with instrumentation logging (fire-and-forget).
   */
  private async instrumentedFetch<T>(
    path: string,
    params?: Record<string, string | undefined>,
    cacheHit?: boolean
  ): Promise<T> {
    const start = performance.now()
    let statusCode: number | undefined
    let errorCode: string | undefined
    let errorMessage: string | undefined

    try {
      const result = await this.fetchAPI<T>(path, params)
      statusCode = 200
      return result
    } catch (err) {
      if (err instanceof SmileBackApiError) {
        statusCode = err.status
        errorCode = err.retryAfterMs ? 'RATE_LIMITED' : 'API_ERROR'
        errorMessage = err.message
      } else if (err instanceof Error) {
        errorCode = 'NETWORK_ERROR'
        errorMessage = err.message
      }
      throw err
    } finally {
      const elapsed = Math.round(performance.now() - start)
      resolveTenantId()
        .then((tenantId) => {
          logApiCall(
            {
              tenantId,
              platform: 'smileback',
              endpoint: path,
              method: 'GET',
              cacheHit: cacheHit ?? false,
            },
            { statusCode, responseTimeMs: elapsed, errorCode, errorMessage }
          )
        })
        .catch(() => {})
    }
  }

  // ── Public Methods ───────────────────────────────────────

  /**
   * Fetch CSAT reviews with optional filters.
   */
  async getCSATReviews(params?: {
    companyId?: string
    dateFrom?: string
    dateTo?: string
    rating?: string
    pageSize?: number
    page?: number
  }): Promise<SmileBackCSATReview[]> {
    const queryParams: Record<string, string | undefined> = {
      company_id: params?.companyId,
      date_from: params?.dateFrom,
      date_to: params?.dateTo,
      rating: params?.rating,
      page_size: params?.pageSize?.toString(),
      page: params?.page?.toString(),
    }

    const cacheKey = buildCacheKey('csat:reviews', queryParams)
    const cached = getCached<SmileBackCSATReview[]>(cacheKey)
    if (cached) return cached

    const raw = await this.instrumentedFetch<Record<string, unknown>[]>(
      '/api/v1/csat/reviews',
      queryParams
    )

    const reviews = raw.map(normalizeCSATReview)
    setCache(cacheKey, reviews, CACHE_TTL_REVIEWS_MS)
    return reviews
  }

  /**
   * Fetch NPS responses with optional filters.
   */
  async getNPSResponses(params?: {
    campaignId?: string
    dateFrom?: string
    dateTo?: string
    pageSize?: number
    page?: number
  }): Promise<SmileBackNPSResponse[]> {
    const queryParams: Record<string, string | undefined> = {
      campaign_id: params?.campaignId,
      date_from: params?.dateFrom,
      date_to: params?.dateTo,
      page_size: params?.pageSize?.toString(),
      page: params?.page?.toString(),
    }

    const cacheKey = buildCacheKey('nps:responses', queryParams)
    const cached = getCached<SmileBackNPSResponse[]>(cacheKey)
    if (cached) return cached

    const raw = await this.instrumentedFetch<Record<string, unknown>[]>(
      '/api/v1/nps/responses',
      queryParams
    )

    const responses = raw.map(normalizeNPSResponse)
    setCache(cacheKey, responses, CACHE_TTL_REVIEWS_MS)
    return responses
  }

  /**
   * Fetch CSAT review for a specific ticket. Returns null if no survey found.
   */
  async getCSATForTicket(ticketId: number): Promise<SmileBackTicketSurvey | null> {
    const cacheKey = `csat:ticket:${ticketId}`
    const cached = getCached<SmileBackTicketSurvey | null>(cacheKey)
    if (cached !== null) return cached

    const raw = await this.instrumentedFetch<Record<string, unknown>[]>(
      '/api/v1/csat/reviews',
      { ticket_id: ticketId.toString() }
    )

    if (!raw || raw.length === 0) {
      // Cache null result to avoid re-fetching for tickets with no survey
      setCache(cacheKey, null, CACHE_TTL_REVIEWS_MS)
      return null
    }

    const review = normalizeCSATReview(raw[0])
    const ticketSurvey: SmileBackTicketSurvey = {
      ticketId,
      rating: review.rating,
      comment: review.comment,
      contact: review.contact,
      createdAt: review.createdAt,
      permalink: review.permalink,
    }

    setCache(cacheKey, ticketSurvey, CACHE_TTL_REVIEWS_MS)
    return ticketSurvey
  }

  /**
   * Compute CSAT summary (positive/neutral/negative counts, overall score).
   */
  async getCSATSummary(params?: {
    dateFrom?: string
    dateTo?: string
    companyId?: string
  }): Promise<SmileBackCSATSummary> {
    const cacheKey = buildCacheKey('csat:summary', {
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
      companyId: params?.companyId,
    })
    const cached = getCached<SmileBackCSATSummary>(cacheKey)
    if (cached) return cached

    const reviews = await this.getCSATReviews({
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
      companyId: params?.companyId,
      pageSize: 1000,
    })

    const summary = computeCSATSummary(reviews)
    setCache(cacheKey, summary, CACHE_TTL_SUMMARY_MS)
    return summary
  }

  /**
   * Compute NPS summary (promoters/passives/detractors, NPS score).
   */
  async getNPSSummary(params?: {
    dateFrom?: string
    dateTo?: string
  }): Promise<SmileBackNPSSummary> {
    const cacheKey = buildCacheKey('nps:summary', {
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
    })
    const cached = getCached<SmileBackNPSSummary>(cacheKey)
    if (cached) return cached

    const responses = await this.getNPSResponses({
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
      pageSize: 1000,
    })

    const summary = computeNPSSummary(responses)
    setCache(cacheKey, summary, CACHE_TTL_SUMMARY_MS)
    return summary
  }

  /**
   * Group CSAT reviews by tech (assignee) with score breakdown.
   */
  async getCSATByTech(params?: {
    dateFrom?: string
    dateTo?: string
  }): Promise<SmileBackTechScore[]> {
    const cacheKey = buildCacheKey('csat:by-tech', {
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
    })
    const cached = getCached<SmileBackTechScore[]>(cacheKey)
    if (cached) return cached

    const reviews = await this.getCSATReviews({
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
      pageSize: 1000,
    })

    const techScores = groupByTech(reviews)
    setCache(cacheKey, techScores, CACHE_TTL_SUMMARY_MS)
    return techScores
  }

  /**
   * Group CSAT + NPS by company with combined score breakdown.
   */
  async getCSATByCompany(params?: {
    dateFrom?: string
    dateTo?: string
  }): Promise<SmileBackCompanyScore[]> {
    const cacheKey = buildCacheKey('csat:by-company', {
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
    })
    const cached = getCached<SmileBackCompanyScore[]>(cacheKey)
    if (cached) return cached

    const [reviews, npsResponses] = await Promise.all([
      this.getCSATReviews({
        dateFrom: params?.dateFrom,
        dateTo: params?.dateTo,
        pageSize: 1000,
      }),
      this.getNPSResponses({
        dateFrom: params?.dateFrom,
        dateTo: params?.dateTo,
        pageSize: 1000,
      }),
    ])

    const companyScores = groupByCompany(reviews, npsResponses)
    setCache(cacheKey, companyScores, CACHE_TTL_SUMMARY_MS)
    return companyScores
  }
}

// ── Singleton Export ──────────────────────────────────────────

export const smileBackClient = new SmileBackClient()
