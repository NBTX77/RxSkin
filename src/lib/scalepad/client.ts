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
  meta?: {
    current_page?: number
    last_page?: number
    total?: number
    per_page?: number
  }
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
        'Authorization': `Bearer ${creds.apiKey}`,
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
 * ScalePad uses page-based pagination with page_size up to 200.
 */
async function scalePadFetchAllPages(
  basePath: string,
  creds: ScalePadCredentials,
  pageSize = 200
): Promise<Record<string, unknown>[]> {
  const allData: Record<string, unknown>[] = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const separator = basePath.includes('?') ? '&' : '?'
    const path = `${basePath}${separator}page=${page}&page_size=${pageSize}`

    const response = await scalePadFetch<ScalePadPaginatedResponse>(path, creds)

    if (response.data && Array.isArray(response.data)) {
      allData.push(...response.data)
    }

    const meta = response.meta
    if (meta && meta.current_page != null && meta.last_page != null) {
      hasMore = meta.current_page < meta.last_page
    } else {
      // If no pagination meta, assume single page
      hasMore = false
    }

    page++
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
  const raw = await scalePadFetchAllPages('/v1/clients', creds)
  return raw.map(normalizeClient)
}

/**
 * Get a single ScalePad client by ID.
 */
export async function getScalePadClient(
  creds: ScalePadCredentials,
  clientId: string
): Promise<CBRClient> {
  const response = await scalePadFetch<{ data: Record<string, unknown> }>(
    `/v1/clients/${clientId}`,
    creds
  )
  return normalizeClient(response.data)
}

// ── Hardware Assets ────────────────────────────────────────────

/**
 * Get hardware assets, optionally filtered by client ID.
 * ScalePad returns all assets — filter client-side by clientId.
 */
export async function getClientHardwareAssets(
  creds: ScalePadCredentials,
  clientId?: string
): Promise<CBRHardwareAsset[]> {
  const path = clientId
    ? `/v1/hardware_assets?client_id=${encodeURIComponent(clientId)}`
    : '/v1/hardware_assets'
  const raw = await scalePadFetchAllPages(path, creds)
  const assets = raw.map(normalizeHardwareAsset)

  if (clientId) {
    return assets.filter((a) => a.clientId === clientId)
  }
  return assets
}

// ── Hardware Lifecycles ────────────────────────────────────────

/**
 * Get hardware lifecycle/warranty data, optionally filtered by client.
 */
export async function getClientHardwareLifecycles(
  creds: ScalePadCredentials,
  clientId?: string
): Promise<CBRHardwareLifecycle[]> {
  const path = clientId
    ? `/v1/hardware_lifecycles?client_id=${encodeURIComponent(clientId)}`
    : '/v1/hardware_lifecycles'
  const raw = await scalePadFetchAllPages(path, creds)
  const lifecycles = raw.map(normalizeHardwareLifecycle)

  if (clientId) {
    return lifecycles.filter((l) => l.clientId === clientId)
  }
  return lifecycles
}

// ── SaaS Assets ────────────────────────────────────────────────

/**
 * Get SaaS/license assets, optionally filtered by client ID.
 */
export async function getClientSaaSAssets(
  creds: ScalePadCredentials,
  clientId?: string
): Promise<CBRSaaSAsset[]> {
  const path = clientId
    ? `/v1/saas_assets?client_id=${encodeURIComponent(clientId)}`
    : '/v1/saas_assets'
  const raw = await scalePadFetchAllPages(path, creds)
  const assets = raw.map(normalizeSaaSAsset)

  if (clientId) {
    return assets.filter((a) => a.clientId === clientId)
  }
  return assets
}

// ── Opportunities ──────────────────────────────────────────────

/**
 * Get opportunities, optionally filtered by client ID.
 */
export async function getClientOpportunities(
  creds: ScalePadCredentials,
  clientId?: string
): Promise<CBROpportunity[]> {
  const path = clientId
    ? `/v1/opportunities?client_id=${encodeURIComponent(clientId)}`
    : '/v1/opportunities'
  const raw = await scalePadFetchAllPages(path, creds)
  const opportunities = raw.map(normalizeOpportunity)

  if (clientId) {
    return opportunities.filter((o) => o.clientId === clientId)
  }
  return opportunities
}

// ── Contracts ──────────────────────────────────────────────────

/**
 * Get contracts, optionally filtered by client ID.
 */
export async function getClientContracts(
  creds: ScalePadCredentials,
  clientId?: string
): Promise<CBRContract[]> {
  const path = clientId
    ? `/v1/contracts?client_id=${encodeURIComponent(clientId)}`
    : '/v1/contracts'
  const raw = await scalePadFetchAllPages(path, creds)
  const contracts = raw.map(normalizeContract)

  if (clientId) {
    return contracts.filter((c) => c.clientId === clientId)
  }
  return contracts
}

// ── Initiatives ────────────────────────────────────────────────

/**
 * Get initiatives, optionally filtered by client ID.
 */
export async function getClientInitiatives(
  creds: ScalePadCredentials,
  clientId?: string
): Promise<CBRInitiative[]> {
  const path = clientId
    ? `/v1/initiatives?client_id=${encodeURIComponent(clientId)}`
    : '/v1/initiatives'
  const raw = await scalePadFetchAllPages(path, creds)
  const initiatives = raw.map(normalizeInitiative)

  if (clientId) {
    return initiatives.filter((i) => i.clientId === clientId)
  }
  return initiatives
}

// ── Action Items ───────────────────────────────────────────────

/**
 * Get action items, optionally filtered by client ID.
 */
export async function getClientActionItems(
  creds: ScalePadCredentials,
  clientId?: string
): Promise<CBRActionItem[]> {
  const path = clientId
    ? `/v1/action_items?client_id=${encodeURIComponent(clientId)}`
    : '/v1/action_items'
  const raw = await scalePadFetchAllPages(path, creds)
  const items = raw.map(normalizeActionItem)

  if (clientId) {
    return items.filter((a) => a.clientId === clientId)
  }
  return items
}
