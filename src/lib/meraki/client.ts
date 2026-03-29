// ============================================================
// Meraki Dashboard API v1 Client — RX Skin BFF Layer
// NEVER import in client components — server-side only.
// Bearer auth, 429 retry with Retry-After, Link header pagination.
// ============================================================

import type {
  MerakiOrganization,
  MerakiNetwork,
  MerakiDevice,
  MerakiDeviceStatus,
  MerakiUplinkStatus,
  MerakiAlert,
  MerakiLicenseOverview,
  MerakiClient,
  MerakiSSID,
  MerakiSwitchPortStatus,
  MerakiFirmwareUpgrade,
} from '@/types/meraki'
import type { MerakiCredentials } from './credentials'
import { logApiCall } from '@/lib/instrumentation/api-logger'
import { resolveTenantId } from '@/lib/instrumentation/tenant-context'

// ── Error Class ─────────────────────────────────────────────

export class MerakiApiError extends Error {
  status: number
  retryAfterMs: number
  constructor(status: number, detail: string, retryAfterMs = 0) {
    super(`Meraki API error: ${status} — ${detail}`)
    this.name = 'MerakiApiError'
    this.status = status
    this.retryAfterMs = retryAfterMs
  }
}

// ── Core Fetch with Retry ───────────────────────────────────

const MAX_RETRIES = 3
const DEFAULT_RETRY_MS = 1000

async function merakiFetch<T>(
  creds: MerakiCredentials,
  path: string,
  options: RequestInit = {},
  retries = 0
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
        Authorization: `Bearer ${creds.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    })

    statusCode = response.status

    // Handle rate limiting with Retry-After header
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10)
      const retryMs = retryAfter * 1000

      if (retries < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, retryMs || DEFAULT_RETRY_MS))
        return merakiFetch<T>(creds, path, options, retries + 1)
      }

      throw new MerakiApiError(429, 'Rate limit exceeded after max retries', retryMs)
    }

    if (!response.ok) {
      const body = await response.text()
      throw new MerakiApiError(response.status, body)
    }

    if (response.status === 204) {
      return null as T
    }

    return response.json() as Promise<T>
  } catch (err) {
    if (err instanceof MerakiApiError) {
      errorCode = 'API_ERROR'
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
            platform: 'meraki',
            endpoint: path,
            method,
          },
          {
            statusCode: statusCode ?? 0,
            responseTimeMs: elapsed,
            errorCode,
            errorMessage,
          }
        )
      })
      .catch(() => {}) // fire-and-forget
  }
}

/**
 * Paginated fetch using RFC 5988 Link headers.
 * Meraki uses cursor-based pagination via Link headers, NOT JSON body metadata.
 */
async function merakiFetchAll<T>(
  creds: MerakiCredentials,
  path: string,
  perPage = 100,
  maxPages = 10
): Promise<T[]> {
  const results: T[] = []
  let nextUrl: string | null = `${creds.baseUrl}${path}${path.includes('?') ? '&' : '?'}perPage=${perPage}`
  let page = 0

  while (nextUrl && page < maxPages) {
    const response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${creds.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10)
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
        continue // retry same page
      }
      throw new MerakiApiError(response.status, await response.text())
    }

    const data = await response.json() as T[]
    results.push(...data)

    // Parse Link header for next page (RFC 5988)
    const linkHeader = response.headers.get('Link')
    nextUrl = parseLinkHeader(linkHeader)
    page++
  }

  return results
}

/**
 * Parse RFC 5988 Link header to extract `rel="next"` URL.
 */
function parseLinkHeader(header: string | null): string | null {
  if (!header) return null
  const links = header.split(',')
  for (const link of links) {
    const match = link.match(/<([^>]+)>;\s*rel="next"/)
    if (match) return match[1]
  }
  return null
}

// ── Organizations ───────────────────────────────────────────

export async function getOrganizations(creds: MerakiCredentials): Promise<MerakiOrganization[]> {
  return merakiFetch<MerakiOrganization[]>(creds, '/organizations')
}

// ── Networks ────────────────────────────────────────────────

export async function getNetworks(creds: MerakiCredentials, orgId: string): Promise<MerakiNetwork[]> {
  return merakiFetchAll<MerakiNetwork>(creds, `/organizations/${orgId}/networks`)
}

export async function getNetwork(creds: MerakiCredentials, networkId: string): Promise<MerakiNetwork> {
  return merakiFetch<MerakiNetwork>(creds, `/networks/${networkId}`)
}

// ── Devices ─────────────────────────────────────────────────

export async function getDeviceStatuses(creds: MerakiCredentials, orgId: string): Promise<MerakiDeviceStatus[]> {
  return merakiFetchAll<MerakiDeviceStatus>(creds, `/organizations/${orgId}/devices/statuses`, 100)
}

export async function getNetworkDevices(creds: MerakiCredentials, networkId: string): Promise<MerakiDevice[]> {
  return merakiFetch<MerakiDevice[]>(creds, `/networks/${networkId}/devices`)
}

export async function getDevice(creds: MerakiCredentials, serial: string): Promise<MerakiDevice> {
  return merakiFetch<MerakiDevice>(creds, `/devices/${serial}`)
}

// ── Uplinks ─────────────────────────────────────────────────

export async function getUplinkStatuses(creds: MerakiCredentials, orgId: string): Promise<MerakiUplinkStatus[]> {
  return merakiFetchAll<MerakiUplinkStatus>(creds, `/organizations/${orgId}/appliance/uplink/statuses`)
}

// ── Alerts ──────────────────────────────────────────────────

export async function getAlerts(creds: MerakiCredentials, networkId: string): Promise<MerakiAlert[]> {
  return merakiFetch<MerakiAlert[]>(creds, `/networks/${networkId}/alerts/history`)
}

// ── Licensing ───────────────────────────────────────────────

export async function getLicenseOverview(creds: MerakiCredentials, orgId: string): Promise<MerakiLicenseOverview> {
  return merakiFetch<MerakiLicenseOverview>(creds, `/organizations/${orgId}/licenses/overview`)
}

// ── Clients ─────────────────────────────────────────────────

export async function getNetworkClients(creds: MerakiCredentials, networkId: string, timespan = 86400): Promise<MerakiClient[]> {
  return merakiFetchAll<MerakiClient>(creds, `/networks/${networkId}/clients?timespan=${timespan}`)
}

// ── Wireless ────────────────────────────────────────────────

export async function getSSIDs(creds: MerakiCredentials, networkId: string): Promise<MerakiSSID[]> {
  return merakiFetch<MerakiSSID[]>(creds, `/networks/${networkId}/wireless/ssids`)
}

// ── Switch Ports ────────────────────────────────────────────

export async function getSwitchPortStatuses(creds: MerakiCredentials, serial: string): Promise<MerakiSwitchPortStatus[]> {
  return merakiFetch<MerakiSwitchPortStatus[]>(creds, `/devices/${serial}/switch/ports/statuses`)
}

// ── Firmware ────────────────────────────────────────────────

export async function getFirmwareUpgrades(creds: MerakiCredentials, orgId: string): Promise<Record<string, MerakiFirmwareUpgrade>> {
  return merakiFetch<Record<string, MerakiFirmwareUpgrade>>(creds, `/organizations/${orgId}/firmware/upgrades`)
}