// ============================================================
// ScalePad REST API Client — RX Skin BFF
// NEVER import this in client components — server-side only.
// ============================================================

import type {
  CBRClient,
  CBRHardwareAsset,
  CBRHardwareLifecycle,
  CBRSaaSAsset,
  CBROpportunity,
  CBRContract,
  CBRInitiative,
  CBRActionItem,
} from '@/types/cbr'
import {
  normalizeClient,
  normalizeHardwareAsset,
  normalizeHardwareLifecycle,
  normalizeSaaSAsset,
  normalizeOpportunity,
  normalizeContract,
  normalizeInitiative,
  normalizeActionItem,
} from './normalizers'
import { logApiCall } from '@/lib/instrumentation/api-logger'
import { resolveTenantId } from '@/lib/instrumentation/tenant-context'

// ── Types ──────────────────────────────────────────────────────

export interface ScalePadCredentials {
  baseUrl: string
  apiKey: string
}

export class ScalePadApiError extends Error {
  status: number
  detail: string
  constructor(status: number, detail: string) {
    super(`ScalePad API error: ${status}`)
    this.name = 'ScalePadApiError'
    this.status = status
    this.detail = detail
  }
}

// ── Pagination Types ───────────────────────────────────────────

interface ScalePadPaginatedResponse {
  data: Record<string, unknown>[]
  total_count?: number
  next_cursor?: string | null
}

// ── Credentials ────────────────────────────────────────────────

/**
 * Get ScalePad credentials from env vars.
 */
export function getScalePadCredentials(): ScalePadCredentials {
  return {
    baseUrl: process.env.SCALEPAD_BASE_URL ?? 'https://api.scalepad.com',
    apiKey: process.env.SCALEPAD_API_KEY ?? '',
  }
}

/**
 * Check if ScalePad credentials are configured.
 */
export function isScalePadConfigured(): boolean {
  return !!process.env.SCALEPAD_API_KEY
}

// ── Core Fetch ─────────────────────────────────────────────────

/**
 * Core fetch wrapper for ScalePad API with Bearer auth and instrumentation.
 */
async function scalePadFetch<T>(
  path: string,
  creds: ScalePadCredentials,
  options: RequestInit = {}
): Promise<T> {
  const url = `${creds.baseUrl}${path}`
  const method = (options.method ?? 'GET').toUpperCase()
  const start = performance.now()

  let statusCode: number | undefined
  let errorCode: string | undefined
  let errorMessage: string | undefined

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'x-api-key': creds.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    })

    statusCode = response.status

    if (!response.ok) {
      const body = await response.text()
      throw new ScalePadApiError(response.status, body)
    }

    if (response.status === 204) return null as T
    return response.json() as Promise<T>
  } catch (err) {
    if (err instanceof ScalePadApiError) {
      errorCode = 'API_ERROR'
      errorMessage = err.detail?.slice(0, 500)
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
          { tenantId, platform: 'scalepad', endpoint: path, method },
          { statusCode, responseTimeMs: elapsed, errorCode, errorMessage }
        )
      })
      .catch(() => {})
  }
}

/**
 * Fetch all pages from a paginated ScalePad endpoint.
 * ScalePad uses cursor-based pagination: pass cursor= query param, response
 * includes next_cursor for subsequent pages (null when done).
 */
async function scalePadFetchAllPages(
  basePath: string,
  creds: ScalePadCredentials,
  pageSize = 200
): Promise<Record<string, unknown>[]> {
  const allData: Record<string, unknown>[] = []
  let cursor: string | undefined = undefined

  while (true) {
    const separator = basePath.includes('?') ? '&' : '?'
    const cursorParam: string = cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''
    const path = `${basePath}${separator}page_size=${pageSize}${cursorParam}`

    const response = await scalePadFetch<ScalePadPaginatedResponse>(path, creds)

    if (response.data && Array.isArray(response.data)) {
      allData.push(...response.data)
    }

    if (response.next_cursor) {
      cursor = response.next_cursor
    } else {
      break
    }
  }

  return allData
}

// ── Clients ────────────────────────────────────────────────────

/**
 * Get all ScalePad clients.
 */
export async function getScalePadClients(
  creds: ScalePadCredentials
): Promise<CBRClient[]> {
  const raw = await scalePadFetchAllPages('/core/v1/clients', creds)
  return raw.map(normalizeClient)
}

/**
 * Get a single ScalePad client by ID.
 */
export async function getScalePadClient(
  creds: ScalePadCredentials,
  clientId: string
): Promise<CBRClient> {
  const response = await scalePadFetch<Record<string, unknown>>(
    `/core/v1/clients/${clientId}`,
    creds
  )
  // Single-item endpoint returns the object directly (no data wrapper)
  const raw = (response as { data?: Record<string, unknown> }).data ?? response
  return normalizeClient(raw)
}

// ── Hardware Assets ────────────────────────────────────────────

/**
 * Get hardware assets, optionally filtered by client ID (client-side).
 */
export async function getClientHardwareAssets(
  creds: ScalePadCredentials,
  clientId?: string
): Promise<CBRHardwareAsset[]> {
  const raw = await scalePadFetchAllPages('/core/v1/assets/hardware', creds)
  const assets = raw.map(normalizeHardwareAsset)
  return clientId ? assets.filter((a) => a.clientId === clientId) : assets
}

// ── Hardware Lifecycles ────────────────────────────────────────

/**
 * Get hardware lifecycle/warranty data, optionally filtered by client (client-side).
 */
export async function getClientHardwareLifecycles(
  creds: ScalePadCredentials,
  clientId?: string
): Promise<CBRHardwareLifecycle[]> {
  const raw = await scalePadFetchAllPages('/lifecycle-manager/v1/assets/hardware/lifecycles', creds)
  const lifecycles = raw.map(normalizeHardwareLifecycle)
  return clientId ? lifecycles.filter((l) => l.clientId === clientId) : lifecycles
}

// ── SaaS Assets ────────────────────────────────────────────────

/**
 * Get SaaS/license assets, optionally filtered by client ID (client-side).
 */
export async function getClientSaaSAssets(
  creds: ScalePadCredentials,
  clientId?: string
): Promise<CBRSaaSAsset[]> {
  const raw = await scalePadFetchAllPages('/core/v1/assets/saas', creds)
  const assets = raw.map(normalizeSaaSAsset)
  return clientId ? assets.filter((a) => a.clientId === clientId) : assets
}

// ── Opportunities ──────────────────────────────────────────────

/**
 * Get opportunities, optionally filtered by client ID (client-side).
 */
export async function getClientOpportunities(
  creds: ScalePadCredentials,
  clientId?: string
): Promise<CBROpportunity[]> {
  const raw = await scalePadFetchAllPages('/core/v1/opportunities', creds)
  const opportunities = raw.map(normalizeOpportunity)
  return clientId ? opportunities.filter((o) => o.clientId === clientId) : opportunities
}

// ── Contracts ──────────────────────────────────────────────────

/**
 * Get contracts, optionally filtered by client ID (client-side).
 */
export async function getClientContracts(
  creds: ScalePadCredentials,
  clientId?: string
): Promise<CBRContract[]> {
  const raw = await scalePadFetchAllPages('/core/v1/service/contracts', creds)
  const contracts = raw.map(normalizeContract)
  return clientId ? contracts.filter((c) => c.clientId === clientId) : contracts
}

// ── Initiatives ────────────────────────────────────────────────

/**
 * Get initiatives, optionally filtered by client ID (client-side).
 */
export async function getClientInitiatives(
  creds: ScalePadCredentials,
  clientId?: string
): Promise<CBRInitiative[]> {
  const raw = await scalePadFetchAllPages('/lifecycle-manager/v1/initiatives', creds)
  const initiatives = raw.map(normalizeInitiative)
  return clientId ? initiatives.filter((i) => i.clientId === clientId) : initiatives
}

// ── Action Items ───────────────────────────────────────────────

/**
 * Get action items, optionally filtered by client ID (client-side).
 */
export async function getClientActionItems(
  creds: ScalePadCredentials,
  clientId?: string
): Promise<CBRActionItem[]> {
  const raw = await scalePadFetchAllPages('/lifecycle-manager/v1/action-items', creds)
  const items = raw.map(normalizeActionItem)
  return clientId ? items.filter((a) => a.clientId === clientId) : items
}
