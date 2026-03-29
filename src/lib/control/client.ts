// ============================================================
// ConnectWise Control (ScreenConnect) API Client — RX Skin BFF
// NEVER import this in client components — server-side only.
// ============================================================

import type { ScreenConnectSession } from '@/types'
import { logApiCall } from '@/lib/instrumentation/api-logger'
import { resolveTenantId } from '@/lib/instrumentation/tenant-context'

export interface ControlCredentials {
  baseUrl: string
  username: string
  password: string
}

export class ControlApiError extends Error {
  status: number
  detail: string
  constructor(status: number, detail: string) {
    super(`Control API error: ${status}`)
    this.name = 'ControlApiError'
    this.status = status
    this.detail = detail
  }
}

/**
 * Build Basic auth header for ScreenConnect.
 */
function buildAuthHeader(creds: ControlCredentials): string {
  const raw = `${creds.username}:${creds.password}`
  return `Basic ${Buffer.from(raw).toString('base64')}`
}

/**
 * Get ScreenConnect credentials from env vars.
 * In production, these would come from the tenant record.
 */
export function getControlCredentials(): ControlCredentials {
  return {
    baseUrl: process.env.SCREENCONNECT_BASE_URL ?? '',
    username: process.env.SCREENCONNECT_USERNAME ?? '',
    password: process.env.SCREENCONNECT_PASSWORD ?? '',
  }
}

/**
 * Check if Control credentials are configured.
 */
export function isControlConfigured(): boolean {
  return !!(
    process.env.SCREENCONNECT_BASE_URL &&
    process.env.SCREENCONNECT_USERNAME &&
    process.env.SCREENCONNECT_PASSWORD
  )
}

/**
 * Fetch all Access sessions from ScreenConnect.
 * Uses the PageService endpoint to get host session info.
 *
 * @param searchFilter - Optional filter by computer name
 * @param limit - Max results (default 1000)
 */
export async function getAccessSessions(
  creds: ControlCredentials,
  searchFilter = '',
  limit = 1000
): Promise<ScreenConnectSession[]> {
  const endpoint = '/Services/PageService.ashx/GetHostSessionInfo'
  const url = `${creds.baseUrl}${endpoint}`
  const start = performance.now()

  // Body: [sessionType, [groupNames], searchFilter, null, limit]
  // sessionType: 0=Support, 1=Meeting, 2=Access
  const body = JSON.stringify([2, ['All Machines'], searchFilter, null, limit])

  let statusCode: number | undefined
  let errorCode: string | undefined
  let errorMessage: string | undefined

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': buildAuthHeader(creds),
        'Content-Type': 'application/json',
      },
      body,
    })

    statusCode = response.status

    if (!response.ok) {
      const detail = await response.text()
      throw new ControlApiError(response.status, detail)
    }

    const data = await response.json()
    const sessions = data?.Sessions ?? data?.sessions ?? data ?? []

    if (!Array.isArray(sessions)) {
      return []
    }

    return sessions.map(normalizeSession)
  } catch (err) {
    if (err instanceof ControlApiError) {
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
          { tenantId, platform: 'control', endpoint, method: 'POST' },
          { statusCode, responseTimeMs: elapsed, errorCode, errorMessage }
        )
      })
      .catch(() => {})
  }
}

/**
 * Get a single session's details by GUID.
 */
export async function getSessionDetails(
  creds: ControlCredentials,
  group: string,
  sessionId: string
): Promise<ScreenConnectSession | null> {
  const endpoint = '/Services/PageService.ashx/GetSessionDetails'
  const url = `${creds.baseUrl}${endpoint}`
  const start = performance.now()
  const body = JSON.stringify([group, sessionId])

  let statusCode: number | undefined
  let errorCode: string | undefined
  let errorMessage: string | undefined

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': buildAuthHeader(creds),
        'Content-Type': 'application/json',
      },
      body,
    })

    statusCode = response.status

    if (!response.ok) {
      if (response.status === 404) return null
      const detail = await response.text()
      throw new ControlApiError(response.status, detail)
    }

    const data = await response.json()
    if (!data) return null
    return normalizeSession(data)
  } catch (err) {
    if (err instanceof ControlApiError) {
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
          { tenantId, platform: 'control', endpoint, method: 'POST' },
          { statusCode, responseTimeMs: elapsed, errorCode, errorMessage }
        )
      })
      .catch(() => {})
  }
}

/**
 * Build a launch URL for a ScreenConnect session.
 * Opens the host page directly to the remote session.
 */
export function buildLaunchUrl(baseUrl: string, sessionId: string): string {
  return `${baseUrl}/Host#Access/All%20Machines//${sessionId}/Join`
}

/**
 * Find a ScreenConnect session by matching computer name.
 * Searches sessions and returns the best match.
 */
export async function findSessionByComputerName(
  creds: ControlCredentials,
  computerName: string
): Promise<ScreenConnectSession | null> {
  const sessions = await getAccessSessions(creds, computerName, 50)

  // Exact match first (case-insensitive)
  const exact = sessions.find(
    (s) => s.name.toLowerCase() === computerName.toLowerCase() ||
           s.hostName.toLowerCase() === computerName.toLowerCase()
  )
  if (exact) return exact

  // Partial match fallback
  const partial = sessions.find(
    (s) => s.name.toLowerCase().includes(computerName.toLowerCase()) ||
           s.hostName.toLowerCase().includes(computerName.toLowerCase())
  )
  return partial ?? null
}

// ── Normalizers ─────────────────────────────────────────────

function normalizeSession(raw: Record<string, unknown>): ScreenConnectSession {
  return {
    sessionId: (raw.SessionID ?? raw.sessionId ?? raw.SessionId ?? '') as string,
    name: (raw.Name ?? raw.name ?? '') as string,
    hostName: (raw.GuestMachineName ?? raw.HostName ?? raw.hostName ?? raw.Name ?? '') as string,
    isOnline: ((raw.GuestConnectedCount as number) > 0) || (raw.IsOnline as boolean) || (raw.isOnline as boolean) || false,
    lastConnected: (raw.GuestLastActivityTime ?? raw.LastConnected ?? raw.lastConnected ?? '') as string,
    guestOperatingSystemName: (raw.GuestOperatingSystemName ?? raw.guestOperatingSystemName ?? '') as string,
    guestMachineName: (raw.GuestMachineName ?? raw.guestMachineName ?? '') as string,
  }
}
