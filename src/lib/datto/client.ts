// ============================================================
// Datto BCDR + SaaS Protection API Client — RX Skin BFF Layer
// NEVER import this in client components — server-side only.
// ============================================================

import type {
  DattoDevice,
  DattoAgent,
  DattoAlert,
  DattoShare,
  DattoVMRestore,
  DattoActivityLog,
  DattoCredentials,
  DattoPaginatedResponse,
  DattoSaaSCustomer,
  DattoSaaSDomain,
  DattoSaaSSeat,
  DattoSaaSApplication,
} from '@/types/datto'
import { logApiCall } from '@/lib/instrumentation/api-logger'
import { resolveTenantId } from '@/lib/instrumentation/tenant-context'

// ── Error Classes ───────────────────────────────────────────

export class DattoApiError extends Error {
  status: number
  detail: string
  constructor(status: number, detail: string) {
    super(`Datto API error: ${status} — ${detail}`)
    this.name = 'DattoApiError'
    this.status = status
    this.detail = detail
  }
}

export class DattoRateLimitError extends Error {
  retryAfterMs: number
  constructor(retryAfterSeconds: number) {
    super(`Datto rate limit exceeded. Retry after ${retryAfterSeconds}s`)
    this.name = 'DattoRateLimitError'
    this.retryAfterMs = retryAfterSeconds * 1000
  }
}

// ── Constants ───────────────────────────────────────────────

const DEFAULT_BASE_URL = 'https://api.datto.com/v1'
const MAX_RETRIES = 3
const BASE_DELAY_MS = 500

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryable(err: unknown): boolean {
  if (err instanceof DattoRateLimitError) return true
  if (err instanceof DattoApiError && err.status >= 500) return true
  return false
}

function getRetryDelay(attempt: number, err: unknown): number {
  if (err instanceof DattoRateLimitError) return err.retryAfterMs
  const base = BASE_DELAY_MS * Math.pow(2, attempt)
  return base + Math.random() * base * 0.5
}

// ── Credential Resolution ───────────────────────────────────

export function getDattoCredentials(): DattoCredentials | null {
  const publicKey = process.env.DATTO_PUBLIC_KEY
  const privateKey = process.env.DATTO_PRIVATE_KEY
  const baseUrl = process.env.DATTO_BASE_URL || DEFAULT_BASE_URL

  if (!publicKey || !privateKey) return null
  return { baseUrl, publicKey, privateKey }
}

export function isDattoConfigured(): boolean {
  return getDattoCredentials() !== null
}

// ── Auth Header ─────────────────────────────────────────────

/**
 * Datto BCDR API uses HTTP Basic Auth with publicKey:privateKey.
 */
function buildAuthHeader(creds: DattoCredentials): string {
  const raw = `${creds.publicKey}:${creds.privateKey}`
  return `Basic ${Buffer.from(raw).toString('base64')}`
}

// ── Core Fetch ──────────────────────────────────────────────

async function dattoFetch<T>(
  creds: DattoCredentials,
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const tenantId = await resolveTenantId()
  const baseUrl = creds.baseUrl.replace(/\/+$/, '')
  const url = new URL(`${baseUrl}${path}`)

  // Attach query params
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  let lastError: unknown = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(getRetryDelay(attempt - 1, lastError))
    }

    const start = performance.now()
    try {
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: buildAuthHeader(creds),
          'Content-Type': 'application/json',
        },
      })

      const elapsed = Math.round(performance.now() - start)

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('Retry-After') || '10')
        lastError = new DattoRateLimitError(retryAfter)
        logApiCall(
          { tenantId, platform: 'datto', endpoint: path, method: 'GET' },
          { statusCode: 429, responseTimeMs: elapsed, errorCode: 'RATE_LIMITED' },
        )
        if (attempt < MAX_RETRIES) continue
        throw lastError
      }

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        lastError = new DattoApiError(res.status, body)
        logApiCall(
          { tenantId, platform: 'datto', endpoint: path, method: 'GET' },
          { statusCode: res.status, responseTimeMs: elapsed, errorCode: `HTTP_${res.status}`, errorMessage: body },
        )
        if (isRetryable(lastError) && attempt < MAX_RETRIES) continue
        throw lastError
      }

      const data = await res.json()

      // Fire-and-forget log
      logApiCall(
        { tenantId, platform: 'datto', endpoint: path, method: 'GET' },
        { statusCode: res.status, responseTimeMs: elapsed },
      )

      return data as T
    } catch (err) {
      if (err instanceof DattoApiError || err instanceof DattoRateLimitError) {
        throw err
      }
      const elapsed = Math.round(performance.now() - start)
      lastError = err
      logApiCall(
        { tenantId, platform: 'datto', endpoint: path, method: 'GET' },
        { responseTimeMs: elapsed, errorCode: 'NETWORK_ERROR', errorMessage: String(err) },
      )
      if (attempt < MAX_RETRIES) continue
      throw err
    }
  }

  throw lastError
}

// ── BCDR Endpoints ──────────────────────────────────────────

/** List all BCDR devices registered under the portal. */
export async function getDattoDevices(
  creds?: DattoCredentials,
  options?: { page?: number; perPage?: number; showHidden?: boolean },
): Promise<DattoPaginatedResponse<DattoDevice>> {
  const c = creds || getDattoCredentials()
  if (!c) throw new DattoApiError(401, 'Datto credentials not configured')

  return dattoFetch<DattoPaginatedResponse<DattoDevice>>(c, '/bcdr/device', {
    page: options?.page || 1,
    perPage: options?.perPage || 100,
    showHiddenDevices: options?.showHidden ? '1' : '0',
  })
}

/** Get a single BCDR device by serial number. */
export async function getDattoDevice(
  serialNumber: string,
  creds?: DattoCredentials,
): Promise<DattoDevice> {
  const c = creds || getDattoCredentials()
  if (!c) throw new DattoApiError(401, 'Datto credentials not configured')

  return dattoFetch<DattoDevice>(c, `/bcdr/device/${encodeURIComponent(serialNumber)}`)
}

/** List agents on a specific device. */
export async function getDattoAgents(
  serialNumber: string,
  creds?: DattoCredentials,
  options?: { page?: number; perPage?: number },
): Promise<DattoPaginatedResponse<DattoAgent>> {
  const c = creds || getDattoCredentials()
  if (!c) throw new DattoApiError(401, 'Datto credentials not configured')

  return dattoFetch<DattoPaginatedResponse<DattoAgent>>(c, `/bcdr/device/${encodeURIComponent(serialNumber)}/asset/agent`, {
    page: options?.page || 1,
    perPage: options?.perPage || 100,
  })
}

/** List all agents across all devices. */
export async function getAllDattoAgents(
  creds?: DattoCredentials,
  options?: { page?: number; perPage?: number },
): Promise<DattoPaginatedResponse<DattoAgent>> {
  const c = creds || getDattoCredentials()
  if (!c) throw new DattoApiError(401, 'Datto credentials not configured')

  return dattoFetch<DattoPaginatedResponse<DattoAgent>>(c, '/bcdr/agent', {
    page: options?.page || 1,
    perPage: options?.perPage || 100,
  })
}

/** List alerts for a specific device. */
export async function getDattoAlerts(
  serialNumber: string,
  creds?: DattoCredentials,
): Promise<DattoPaginatedResponse<DattoAlert>> {
  const c = creds || getDattoCredentials()
  if (!c) throw new DattoApiError(401, 'Datto credentials not configured')

  return dattoFetch<DattoPaginatedResponse<DattoAlert>>(c, `/bcdr/device/${encodeURIComponent(serialNumber)}/alert`)
}

/** List shares on a specific device. */
export async function getDattoShares(
  serialNumber: string,
  creds?: DattoCredentials,
): Promise<DattoPaginatedResponse<DattoShare>> {
  const c = creds || getDattoCredentials()
  if (!c) throw new DattoApiError(401, 'Datto credentials not configured')

  return dattoFetch<DattoPaginatedResponse<DattoShare>>(c, `/bcdr/device/${encodeURIComponent(serialNumber)}/asset/share`)
}

/** List volumes on a specific device. */
export async function getDattoVolumes(
  serialNumber: string,
  creds?: DattoCredentials,
) {
  const c = creds || getDattoCredentials()
  if (!c) throw new DattoApiError(401, 'Datto credentials not configured')

  return dattoFetch(c, `/bcdr/device/${encodeURIComponent(serialNumber)}/asset/volume`)
}

/** List active VM restores. */
export async function getDattoVMRestores(
  serialNumber: string,
  creds?: DattoCredentials,
): Promise<DattoPaginatedResponse<DattoVMRestore>> {
  const c = creds || getDattoCredentials()
  if (!c) throw new DattoApiError(401, 'Datto credentials not configured')

  return dattoFetch<DattoPaginatedResponse<DattoVMRestore>>(c, `/bcdr/device/${encodeURIComponent(serialNumber)}/vm-restores`)
}

/** Get assets (agents + shares) for a device. */
export async function getDattoAssets(
  serialNumber: string,
  creds?: DattoCredentials,
) {
  const c = creds || getDattoCredentials()
  if (!c) throw new DattoApiError(401, 'Datto credentials not configured')

  return dattoFetch(c, `/bcdr/device/${encodeURIComponent(serialNumber)}/asset`)
}

/** Get BCDR activity log. */
export async function getDattoActivityLog(
  creds?: DattoCredentials,
  options?: { page?: number; perPage?: number },
): Promise<DattoPaginatedResponse<DattoActivityLog>> {
  const c = creds || getDattoCredentials()
  if (!c) throw new DattoApiError(401, 'Datto credentials not configured')

  return dattoFetch<DattoPaginatedResponse<DattoActivityLog>>(c, '/bcdr/activity-log', {
    page: options?.page || 1,
    perPage: options?.perPage || 100,
  })
}

// ── SaaS Protection Endpoints ───────────────────────────────

/** List SaaS Protection customers. */
export async function getDattoSaaSCustomers(
  creds?: DattoCredentials,
  options?: { page?: number; perPage?: number },
): Promise<DattoPaginatedResponse<DattoSaaSCustomer>> {
  const c = creds || getDattoCredentials()
  if (!c) throw new DattoApiError(401, 'Datto credentials not configured')

  return dattoFetch<DattoPaginatedResponse<DattoSaaSCustomer>>(c, '/saas/domains', {
    page: options?.page || 1,
    perPage: options?.perPage || 100,
  })
}

/** List protected domains for a SaaS customer. */
export async function getDattoSaaSDomains(
  customerId: number,
  creds?: DattoCredentials,
): Promise<DattoSaaSDomain[]> {
  const c = creds || getDattoCredentials()
  if (!c) throw new DattoApiError(401, 'Datto credentials not configured')

  return dattoFetch<DattoSaaSDomain[]>(c, `/saas/${customerId}/domains`)
}

/** List seats for a SaaS customer. */
export async function getDattoSaaSSeats(
  customerId: number,
  creds?: DattoCredentials,
  options?: { page?: number; perPage?: number },
): Promise<DattoPaginatedResponse<DattoSaaSSeat>> {
  const c = creds || getDattoCredentials()
  if (!c) throw new DattoApiError(401, 'Datto credentials not configured')

  return dattoFetch<DattoPaginatedResponse<DattoSaaSSeat>>(c, `/saas/${customerId}/seats`, {
    page: options?.page || 1,
    perPage: options?.perPage || 100,
  })
}

/** List applications for a SaaS customer. */
export async function getDattoSaaSApplications(
  customerId: number,
  creds?: DattoCredentials,
): Promise<DattoSaaSApplication[]> {
  const c = creds || getDattoCredentials()
  if (!c) throw new DattoApiError(401, 'Datto credentials not configured')

  return dattoFetch<DattoSaaSApplication[]>(c, `/saas/${customerId}/applications`)
}

// ── Test Connection ─────────────────────────────────────────

/** Test Datto API connectivity by fetching the device list (page 1, 1 result). */
export async function testDattoConnection(creds: DattoCredentials): Promise<{ ok: boolean; message: string; deviceCount?: number }> {
  try {
    const result = await dattoFetch<DattoPaginatedResponse<DattoDevice>>(creds, '/bcdr/device', {
      page: 1,
      perPage: 1,
    })
    return {
      ok: true,
      message: `Connected — ${result.pagination?.count || 0} devices found`,
      deviceCount: result.pagination?.count || 0,
    }
  } catch (err) {
    if (err instanceof DattoApiError) {
      return { ok: false, message: `HTTP ${err.status}: ${err.detail}` }
    }
    return { ok: false, message: String(err) }
  }
}
