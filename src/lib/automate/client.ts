// ============================================================
// ConnectWise Automate REST API Client — RX Skin BFF
// NEVER import this in client components — server-side only.
// ============================================================

import type { AutomateComputer, AutomateScript, ScriptRunResult } from '@/types'
import { logApiCall } from '@/lib/instrumentation/api-logger'
import { getDefaultTenantId } from '@/lib/instrumentation/tenant-context'

export interface AutomateCredentials {
  baseUrl: string
  username: string
  password: string
}

export class AutomateApiError extends Error {
  status: number
  detail: string
  constructor(status: number, detail: string) {
    super(`Automate API error: ${status}`)
    this.name = 'AutomateApiError'
    this.status = status
    this.detail = detail
  }
}

// Token cache for session-based auth
let cachedToken: { value: string; expiresAt: number } | null = null

/**
 * Get Automate credentials from env vars.
 */
export function getAutomateCredentials(): AutomateCredentials {
  return {
    baseUrl: process.env.AUTOMATE_BASE_URL ?? '',
    username: process.env.AUTOMATE_USERNAME ?? '',
    password: process.env.AUTOMATE_PASSWORD ?? '',
  }
}

/**
 * Check if Automate credentials are configured.
 */
export function isAutomateConfigured(): boolean {
  return !!(
    process.env.AUTOMATE_BASE_URL &&
    process.env.AUTOMATE_USERNAME &&
    process.env.AUTOMATE_PASSWORD
  )
}

/**
 * Authenticate and get a session token.
 */
async function getToken(creds: AutomateCredentials): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value
  }

  const response = await fetch(`${creds.baseUrl}/cwa/api/v1/apitoken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      UserName: creds.username,
      Password: creds.password,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new AutomateApiError(response.status, detail)
  }

  const data = await response.json()
  const token = data.AccessToken ?? data.accessToken ?? ''

  // Cache token for 55 minutes (tokens expire at 60 min)
  cachedToken = { value: token, expiresAt: Date.now() + 55 * 60 * 1000 }
  return token
}

/**
 * Core fetch wrapper for Automate API with instrumentation.
 */
async function automateFetch<T>(
  creds: AutomateCredentials,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken(creds)
  const url = `${creds.baseUrl}/cwa/api/v1${path}`
  const method = (options.method ?? 'GET').toUpperCase()
  const start = performance.now()

  let statusCode: number | undefined
  let errorCode: string | undefined
  let errorMessage: string | undefined

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    statusCode = response.status

    if (!response.ok) {
      const body = await response.text()
      throw new AutomateApiError(response.status, body)
    }

    if (response.status === 204) return null as T
    return response.json() as Promise<T>
  } catch (err) {
    if (err instanceof AutomateApiError) {
      errorCode = 'API_ERROR'
      errorMessage = err.detail?.slice(0, 500)
    } else if (err instanceof Error) {
      errorCode = 'NETWORK_ERROR'
      errorMessage = err.message
    }
    throw err
  } finally {
    const elapsed = Math.round(performance.now() - start)
    getDefaultTenantId()
      .then((tenantId) => {
        logApiCall(
          { tenantId, platform: 'automate', endpoint: path, method },
          { statusCode, responseTimeMs: elapsed, errorCode, errorMessage }
        )
      })
      .catch(() => {})
  }
}

// ── Computers ──────────────────────────────────────────────

/**
 * Get computers filtered by client name (company).
 */
export async function getComputersByClient(
  creds: AutomateCredentials,
  clientName: string,
  pageSize = 100
): Promise<AutomateComputer[]> {
  const condition = encodeURIComponent(`Client.Name = '${clientName}'`)
  const raw = await automateFetch<Record<string, unknown>[]>(
    creds,
    `/computers?condition=${condition}&pageSize=${pageSize}`
  )
  return raw.map(normalizeComputer)
}

/**
 * Get a single computer by ID.
 */
export async function getComputer(
  creds: AutomateCredentials,
  computerId: number
): Promise<AutomateComputer> {
  const raw = await automateFetch<Record<string, unknown>>(
    creds,
    `/computers/${computerId}`
  )
  return normalizeComputer(raw)
}

/**
 * Search computers by name.
 */
export async function searchComputers(
  creds: AutomateCredentials,
  search: string,
  pageSize = 50
): Promise<AutomateComputer[]> {
  const condition = encodeURIComponent(`ComputerName contains '${search}'`)
  const raw = await automateFetch<Record<string, unknown>[]>(
    creds,
    `/computers?condition=${condition}&pageSize=${pageSize}`
  )
  return raw.map(normalizeComputer)
}

// ── Scripts ────────────────────────────────────────────────

/**
 * Get available scripts (excluding system function scripts).
 */
export async function getScripts(
  creds: AutomateCredentials,
  search?: string,
  pageSize = 100
): Promise<AutomateScript[]> {
  let path = `/scripts?pageSize=${pageSize}`
  if (search) {
    const condition = encodeURIComponent(`Name contains '${search}'`)
    path += `&condition=${condition}`
  }

  const raw = await automateFetch<Record<string, unknown>[]>(creds, path)
  return raw.map(normalizeScript)
}

/**
 * Run a script against one or more computers.
 */
export async function runScript(
  creds: AutomateCredentials,
  scriptId: number,
  computerIds: number[],
  parameters?: Record<string, string>
): Promise<ScriptRunResult> {
  // Automate uses the schedule endpoint to queue scripts
  const body: Record<string, unknown> = {
    ScriptId: scriptId,
    ComputerIds: computerIds,
  }
  if (parameters) {
    body.Parameters = parameters
  }

  await automateFetch(creds, '/scripts/running', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  return {
    scriptId,
    computerId: computerIds[0],
    status: 'queued',
    message: `Script ${scriptId} queued on ${computerIds.length} computer(s)`,
  }
}

// ── Normalizers ─────────────────────────────────────────────

/** Safely access a nested property from a raw API object (handles PascalCase + camelCase). */
function prop(raw: Record<string, unknown>, pascal: string, camel: string): unknown {
  return raw[pascal] ?? raw[camel]
}

function sub(raw: Record<string, unknown>, pascal: string, camel: string): Record<string, unknown> | undefined {
  return (raw[pascal] ?? raw[camel]) as Record<string, unknown> | undefined
}

function normalizeComputer(raw: Record<string, unknown>): AutomateComputer {
  const client = sub(raw, 'Client', 'client')
  const location = sub(raw, 'Location', 'location')
  const virusScanner = sub(raw, 'VirusScanner', 'virusScanner')
  const totalMem = (prop(raw, 'TotalMemory', 'totalMemory') ?? 0) as number
  const freeMem = (prop(raw, 'FreeMemory', 'freeMemory') ?? 0) as number
  const uptimeMinutes = (prop(raw, 'SystemUptime', 'systemUptime') ?? 0) as number

  return {
    id: Number(prop(raw, 'Id', 'id') ?? 0),
    computerName: (prop(raw, 'ComputerName', 'computerName') ?? '') as string,
    clientName: (client?.Name ?? client?.name ?? '') as string,
    clientId: Number(client?.Id ?? client?.id ?? 0),
    locationName: (location?.Name ?? location?.name ?? '') as string,
    status: (prop(raw, 'Status', 'status') ?? 'Offline') as string,
    operatingSystem: (prop(raw, 'OperatingSystemName', 'operatingSystemName') ?? '') as string,
    localIP: (prop(raw, 'LocalIPAddress', 'localIPAddress') ?? '') as string,
    lastContact: (prop(raw, 'RemoteAgentLastContact', 'remoteAgentLastContact') ?? '') as string,
    lastHeartbeat: (prop(raw, 'LastHeartbeat', 'lastHeartbeat') ?? '') as string,
    cpuUsage: (prop(raw, 'CpuUsage', 'cpuUsage') ?? 0) as number,
    totalMemoryGB: Math.round((totalMem / 1_073_741_824) * 10) / 10,
    freeMemoryGB: Math.round((freeMem / 1_073_741_824) * 10) / 10,
    type: (prop(raw, 'Type', 'type') ?? 'Workstation') as string,
    isRebootNeeded: (prop(raw, 'IsRebootNeeded', 'isRebootNeeded') ?? false) as boolean,
    domain: (prop(raw, 'DomainName', 'domainName') ?? '') as string,
    lastUserName: (prop(raw, 'LastUserName', 'lastUserName') ?? '') as string,
    serialNumber: (prop(raw, 'SerialNumber', 'serialNumber') ?? '') as string,
    biosManufacturer: (prop(raw, 'BiosManufacturer', 'biosManufacturer') ?? '') as string,
    systemUptimeDays: Math.round(uptimeMinutes / 1440),
    antivirusName: (virusScanner?.Name ?? virusScanner?.name ?? '') as string,
    antivirusDefDate: (prop(raw, 'AntivirusDefinitionDate', 'antivirusDefinitionDate') ?? '') as string,
    windowsUpdateDate: (prop(raw, 'WindowsUpdateDate', 'windowsUpdateDate') ?? '') as string,
    tempFiles: (prop(raw, 'TempFiles', 'tempFiles') ?? '') as string,
    macAddress: (prop(raw, 'MACAddress', 'macAddress') ?? '') as string,
  }
}

function normalizeScript(raw: Record<string, unknown>): AutomateScript {
  const folder = sub(raw, 'Folder', 'folder')
  const params = (prop(raw, 'Parameters', 'parameters') ?? []) as unknown[]
  return {
    id: Number(prop(raw, 'Id', 'id') ?? 0),
    name: (prop(raw, 'Name', 'name') ?? '') as string,
    description: (prop(raw, 'Comments', 'comments') ?? '') as string,
    folder: (prop(raw, 'FullFolderPath', 'fullFolderPath') ?? folder?.Name ?? '') as string,
    hasParameters: params.length > 0,
    parameters: params,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
