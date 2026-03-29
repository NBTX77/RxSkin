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

/**
 * Log an API call to the database. Fire-and-forget — errors are
 * swallowed to avoid disrupting the main request flow.
 */
export function logApiCall(
  context: ApiCallContext,
  result: ApiCallResult
): void {
  // Fire and forget — don't await, don't block
  prisma.apiCallLog
    .create({
      data: {
        tenantId: context.tenantId,
        platform: context.platform,
        endpoint: context.endpoint,
        method: context.method ?? 'GET',
        statusCode: result.statusCode,
        responseTimeMs: result.responseTimeMs,
        cacheHit: context.cacheHit ?? false,
        requestPayloadSize: result.requestPayloadSize,
        responsePayloadSize: result.responsePayloadSize,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage?.slice(0, 1000), // Truncate long errors
        userId: context.userId,
      },
    })
    .catch((err) => {
      // Log to console but never throw — observability must not break the app
      console.error('[api-logger] Failed to log API call:', err?.message)
    })
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
