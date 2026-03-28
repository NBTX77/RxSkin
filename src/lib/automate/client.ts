// ============================================================
// ConnectWise Automate REST API Client — RX Skin BFF
// NEVER import this in client components — server-side only.
// ============================================================

import type { AutomateComputer, AutomateScript, ScriptRunResult } from '@/types'

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
 * Core fetch wrapper for Automate API.
 */
async function automateFetch<T>(
  creds: AutomateCredentials,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken(creds)
  const url = `${creds.baseUrl}/cwa/api/v1${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new AutomateApiError(response.status, body)
  }

  if (response.status === 204) return null as T
  return response.json() as Promise<T>
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

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizeComputer(raw: any): AutomateComputer {
  const totalMem = raw.TotalMemory ?? raw.totalMemory ?? 0
  const freeMem = raw.FreeMemory ?? raw.freeMemory ?? 0
  const uptimeMinutes = raw.SystemUptime ?? raw.systemUptime ?? 0

  return {
    id: Number(raw.Id ?? raw.id ?? 0),
    computerName: raw.ComputerName ?? raw.computerName ?? '',
    clientName: raw.Client?.Name ?? raw.client?.name ?? '',
    clientId: Number(raw.Client?.Id ?? raw.client?.id ?? 0),
    locationName: raw.Location?.Name ?? raw.location?.name ?? '',
    status: raw.Status ?? raw.status ?? 'Offline',
    operatingSystem: raw.OperatingSystemName ?? raw.operatingSystemName ?? '',
    localIP: raw.LocalIPAddress ?? raw.localIPAddress ?? '',
    lastContact: raw.RemoteAgentLastContact ?? raw.remoteAgentLastContact ?? '',
    lastHeartbeat: raw.LastHeartbeat ?? raw.lastHeartbeat ?? '',
    cpuUsage: raw.CpuUsage ?? raw.cpuUsage ?? 0,
    totalMemoryGB: Math.round((totalMem / 1_073_741_824) * 10) / 10,
    freeMemoryGB: Math.round((freeMem / 1_073_741_824) * 10) / 10,
    type: raw.Type ?? raw.type ?? 'Workstation',
    isRebootNeeded: raw.IsRebootNeeded ?? raw.isRebootNeeded ?? false,
    domain: raw.DomainName ?? raw.domainName ?? '',
    lastUserName: raw.LastUserName ?? raw.lastUserName ?? '',
    serialNumber: raw.SerialNumber ?? raw.serialNumber ?? '',
    biosManufacturer: raw.BiosManufacturer ?? raw.biosManufacturer ?? '',
    systemUptimeDays: Math.round(uptimeMinutes / 1440),
    antivirusName: raw.VirusScanner?.Name ?? raw.virusScanner?.name ?? '',
    antivirusDefDate: raw.AntivirusDefinitionDate ?? raw.antivirusDefinitionDate ?? '',
    windowsUpdateDate: raw.WindowsUpdateDate ?? raw.windowsUpdateDate ?? '',
    tempFiles: raw.TempFiles ?? raw.tempFiles ?? '',
    macAddress: raw.MACAddress ?? raw.macAddress ?? '',
  }
}

function normalizeScript(raw: any): AutomateScript {
  return {
    id: Number(raw.Id ?? raw.id ?? 0),
    name: raw.Name ?? raw.name ?? '',
    description: raw.Comments ?? raw.comments ?? '',
    folder: raw.FullFolderPath ?? raw.fullFolderPath ?? raw.Folder?.Name ?? '',
    hasParameters: (raw.Parameters ?? raw.parameters ?? []).length > 0,
    parameters: raw.Parameters ?? raw.parameters ?? [],
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */