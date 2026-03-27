import { RateLimitError, CWApiError } from '@/lib/cw/client'

export type ApiErrorResponse = {
  code: string
  message: string
  retryable: boolean
  retryAfter?: number
}

export const apiErrors = {
  unauthorized: (): Response =>
    Response.json(
      { code: 'UNAUTHORIZED', message: 'Authentication required', retryable: false } satisfies ApiErrorResponse,
      { status: 401 }
    ),
  forbidden: (): Response =>
    Response.json(
      { code: 'FORBIDDEN', message: 'Insufficient permissions', retryable: false } satisfies ApiErrorResponse,
      { status: 403 }
    ),
  notFound: (resource = 'Resource'): Response =>
    Response.json(
      { code: 'NOT_FOUND', message: `${resource} not found`, retryable: false } satisfies ApiErrorResponse,
      { status: 404 }
    ),
  badRequest: (message: string): Response =>
    Response.json(
      { code: 'BAD_REQUEST', message, retryable: false } satisfies ApiErrorResponse,
      { status: 400 }
    ),
  rateLimited: (retryAfter: number): Response =>
    Response.json(
      { code: 'RATE_LIMITED', message: 'Service temporarily busy. Please retry.', retryable: true, retryAfter } satisfies ApiErrorResponse,
      { status: 503 }
    ),
  internal: (message = 'An unexpected error occurred'): Response =>
    Response.json(
      { code: 'INTERNAL_ERROR', message, retryable: false } satisfies ApiErrorResponse,
      { status: 500 }
    ),
}

export function handleApiError(error: unknown): Response {
  console.error('[API Error]', error)
  if (error instanceof RateLimitError) return apiErrors.rateLimited(Math.ceil(error.retryAfterMs / 1000))
  if (error instanceof CWApiError) {
    if (error.status === 404) return apiErrors.notFound()
    if (error.status === 401 || error.status === 403) return apiErrors.forbidden()
    return apiErrors.internal(`ConnectWise API error: ${error.status}`)
  }
  return apiErrors.internal()
}
