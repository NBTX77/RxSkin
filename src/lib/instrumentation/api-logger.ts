// ============================================================
// API Call Instrumentation — RX Skin
// Logs every outbound API call to api_call_logs for observability.
// Fire-and-forget writes — never blocks the API response.
// ============================================================

import prisma from '@/lib/db/prisma'

export type Platform =
  | 'connectwise'
  | 'samsara'
  | 'automate'
  | 'control'
  | 'graph'
  | 'webex'
  | 'auvik'
  | 'meraki'
  | 'datto'
  | 'sentinelone'
  | 'passportal'
  | 'scalepad'

export interface ApiCallContext {
  tenantId: string
  platform: Platform
  endpoint: string
  method?: string
  userId?: string
  cacheHit?: boolean
}

export interface ApiCallResult {
  statusCode?: number
  responseTimeMs: number
  requestPayloadSize?: number
  responsePayloadSize?: number
  errorCode?: string
  errorMessage?: string
}

// ── Batched Log Queue ─────────────────────────────────────────
// Collects API call logs and flushes them in bulk to reduce DB write pressure.
// Flushes every FLUSH_INTERVAL_MS or when the queue reaches FLUSH_THRESHOLD.

const FLUSH_INTERVAL_MS = 5_000
const FLUSH_THRESHOLD = 25

interface LogEntry {
  tenantId: string
  platform: string
  endpoint: string
  method: string
  statusCode: number | null
  responseTimeMs: number
  cacheHit: boolean
  requestPayloadSize: number | null
  responsePayloadSize: number | null
  errorCode: string | null
  errorMessage: string | null
  userId: string | null
}

let logQueue: LogEntry[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null

function ensureFlushTimer(): void {
  if (flushTimer) return
  flushTimer = setInterval(() => {
    flushLogQueue()
  }, FLUSH_INTERVAL_MS)
  // Allow process to exit without waiting for timer
  if (typeof flushTimer === 'object' && 'unref' in flushTimer) {
    flushTimer.unref()
  }
}

function flushLogQueue(): void {
  if (logQueue.length === 0) return
  const batch = logQueue
  logQueue = []

  prisma.apiCallLog
    .createMany({ data: batch })
    .catch((err) => {
      console.error(`[api-logger] Failed to flush ${batch.length} log entries:`, err?.message)
    })
}

/**
 * Log an API call to the database. Batches writes for efficiency —
 * flushes every 5s or at 25 queued events. Fire-and-forget.
 */
export function logApiCall(
  context: ApiCallContext,
  result: ApiCallResult
): void {
  logQueue.push({
    tenantId: context.tenantId,
    platform: context.platform,
    endpoint: context.endpoint,
    method: context.method ?? 'GET',
    statusCode: result.statusCode ?? null,
    responseTimeMs: result.responseTimeMs,
    cacheHit: context.cacheHit ?? false,
    requestPayloadSize: result.requestPayloadSize ?? null,
    responsePayloadSize: result.responsePayloadSize ?? null,
    errorCode: result.errorCode ?? null,
    errorMessage: result.errorMessage?.slice(0, 1000) ?? null,
    userId: context.userId ?? null,
  })

  ensureFlushTimer()

  if (logQueue.length >= FLUSH_THRESHOLD) {
    flushLogQueue()
  }
}

/**
 * Wraps any async fetcher function with automatic timing and logging.
 * Use this to instrument any API client's core fetch wrapper.
 *
 * @example
 * const data = await instrumentedFetch(
 *   { tenantId, platform: 'connectwise', endpoint: '/service/tickets' },
 *   () => cwFetch(creds, '/service/tickets?pageSize=50')
 * )
 */
export async function instrumentedFetch<T>(
  context: ApiCallContext,
  fetcher: () => Promise<T>
): Promise<T> {
  const start = performance.now()

  try {
    const result = await fetcher()
    const elapsed = Math.round(performance.now() - start)

    logApiCall(context, {
      statusCode: 200,
      responseTimeMs: elapsed,
      responsePayloadSize: estimateSize(result),
    })

    return result
  } catch (error: unknown) {
    const elapsed = Math.round(performance.now() - start)
    const { statusCode, errorCode, errorMessage } = extractErrorInfo(error)

    logApiCall(context, {
      statusCode,
      responseTimeMs: elapsed,
      errorCode,
      errorMessage,
    })

    throw error // Re-throw — instrumentation is transparent
  }
}

/**
 * Rough estimate of JSON payload size in bytes.
 */
function estimateSize(data: unknown): number {
  try {
    return JSON.stringify(data).length
  } catch {
    return 0
  }
}

/**
 * Extract status/error info from various API error types.
 */
function extractErrorInfo(error: unknown): {
  statusCode?: number
  errorCode?: string
  errorMessage?: string
} {
  if (error instanceof Error) {
    const status = (error as { status?: number }).status
    const retryAfterMs = (error as { retryAfterMs?: number }).retryAfterMs

    return {
      statusCode: status,
      errorCode: retryAfterMs ? 'RATE_LIMITED' : error.name,
      errorMessage: error.message,
    }
  }
  return { errorMessage: String(error) }
}
