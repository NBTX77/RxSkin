// ============================================================
// Samsara Fleet API Client — RX Skin BFF Layer
// NEVER import this in client components — server-side only.
// ============================================================

import type {
  SamsaraVehicle,
  SamsaraVehicleLocation,
  SamsaraDriver,
  SamsaraHosClock,
} from '@/types/ops'

export interface SamsaraCredentials {
  apiToken: string
  baseUrl: string // https://api.samsara.com
}

class SamsaraApiError extends Error {
  status: number
  constructor(status: number, detail: string) {
    super(`Samsara API error: ${status} — ${detail}`)
    this.name = 'SamsaraApiError'
    this.status = status
  }
}

/**
 * Core fetch wrapper for Samsara API with Bearer auth.
 */
async function samsaraFetch<T>(
  creds: SamsaraCredentials,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${creds.baseUrl}${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${creds.apiToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new SamsaraApiError(response.status, body)
  }

  if (response.status === 204) {
    return null as T
  }

  return response.json() as Promise<T>
}
// ── Vehicle Endpoints ────────────────────────────

interface SamsaraVehicleListResponse {
  data: Array<{
    id: string
    name: string
    vin?: string
    make?: string
    model?: string
    year?: number
    licensePlate?: string
    serial?: string
  }>
}

export async function getVehicles(creds: SamsaraCredentials): Promise<SamsaraVehicle[]> {
  const res = await samsaraFetch<SamsaraVehicleListResponse>(creds, '/fleet/vehicles')
  return res.data.map((v) => ({
    id: v.id,
    name: v.name,
    vin: v.vin,
    make: v.make,
    model: v.model,
    year: v.year,
    licensePlate: v.licensePlate,
    serial: v.serial,
  }))
}

interface SamsaraLocationListResponse {
  data: Array<{
    id: string
    name: string
    location: {
      latitude: number
      longitude: number
      speed: number
      heading: number
      time: string
    }
  }>
}

export async function getVehicleLocations(
  creds: SamsaraCredentials
): Promise<SamsaraVehicleLocation[]> {
  const res = await samsaraFetch<SamsaraLocationListResponse>(
    creds,
    '/fleet/vehicles/locations'
  )
  return res.data.map((v) => ({
    id: v.id,
    name: v.name,
    latitude: v.location.latitude,
    longitude: v.location.longitude,
    speed: v.location.speed,
    heading: v.location.heading,
    time: v.location.time,
  }))
}
// ── Driver Endpoints ─────────────────────────────

interface SamsaraDriverListResponse {
  data: Array<{
    id: string
    name: string
    username?: string
    phone?: string
    currentVehicle?: {
      id: string
      name: string
    }
  }>
}

export async function getDrivers(creds: SamsaraCredentials): Promise<SamsaraDriver[]> {
  const res = await samsaraFetch<SamsaraDriverListResponse>(creds, '/fleet/drivers')
  return res.data.map((d) => ({
    id: d.id,
    name: d.name,
    username: d.username,
    phone: d.phone,
    vehicleId: d.currentVehicle?.id,
    vehicleName: d.currentVehicle?.name,
  }))
}

// ── HOS Endpoints ────────────────────────────────

interface SamsaraHosClockResponse {
  data: Array<{
    driver: {
      id: string
      name: string
    }
    clocks: {
      drive: { timeRemainingMs: number }
      shift: { timeRemainingMs: number }
      cycle: { timeRemainingMs: number }
      break: { timeRemainingMs: number }
    }
    currentDutyStatus: {
      dutyStatus: string
    }
  }>
}

export async function getHosClocks(creds: SamsaraCredentials): Promise<SamsaraHosClock[]> {
  const res = await samsaraFetch<SamsaraHosClockResponse>(creds, '/fleet/hos/clocks')
  return res.data.map((h) => ({
    driverId: h.driver.id,
    driverName: h.driver.name,
    driveTimeRemainingMs: h.clocks.drive.timeRemainingMs,
    shiftTimeRemainingMs: h.clocks.shift.timeRemainingMs,
    cycleTimeRemainingMs: h.clocks.cycle.timeRemainingMs,
    breakTimeRemainingMs: h.clocks.break.timeRemainingMs,
    dutyStatus: h.currentDutyStatus.dutyStatus,
  }))
}

/**
 * Get Samsara credentials from environment variables.
 * In multi-tenant mode, these would come from the database.
 */
export function getSamsaraCredentials(): SamsaraCredentials {
  return {
    apiToken: process.env.SAMSARA_API_TOKEN ?? '',
    baseUrl: process.env.SAMSARA_BASE_URL ?? 'https://api.samsara.com',
  }
}

export function isSamsaraConfigured(): boolean {
  return !!process.env.SAMSARA_API_TOKEN
}

// ── Vehicle GPS History (Trail) ─────────────────

export interface GpsPoint {
  latitude: number
  longitude: number
  speedMph: number
  headingDegrees: number
  time: string
}

export interface VehicleTrail {
  vehicleId: string
  vehicleName: string
  points: GpsPoint[]
}

interface SamsaraStatsHistoryResponse {
  data: Array<{
    id: string
    name: string
    gps: Array<{
      time: string
      latitude: number
      longitude: number
      headingDegrees: number
      speedMilesPerHour: number
    }>
  }>
}

/**
 * Fetch GPS breadcrumb history for all vehicles over a time window.
 * Uses `/fleet/vehicles/stats/history?types=gps`.
 * Returns ~5-second resolution when vehicles are moving.
 */
export async function getVehicleLocationHistory(
  creds: SamsaraCredentials,
  startTime: string,
  endTime: string
): Promise<VehicleTrail[]> {
  const params = new URLSearchParams({
    types: 'gps',
    startTime,
    endTime,
  })

  const res = await samsaraFetch<SamsaraStatsHistoryResponse>(
    creds,
    `/fleet/vehicles/stats/history?${params.toString()}`
  )

  return res.data.map((v) => ({
    vehicleId: v.id,
    vehicleName: v.name,
    points: (v.gps ?? []).map((p) => ({
      latitude: p.latitude,
      longitude: p.longitude,
      speedMph: p.speedMilesPerHour,
      headingDegrees: p.headingDegrees,
      time: p.time,
    })),
  }))
}