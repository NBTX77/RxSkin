// ============================================================
// Ops Hub TypeScript Types — RX Skin
// Fleet tracking, analytics, and schedule hold types.
// ============================================================

// ── Fleet / Samsara ──────────────────────────────

export interface FleetTech {
  id: string
  name: string
  memberId: number
  memberIdentifier: string
  truckName: string
  vehicleId: string
  lat: number
  lng: number
  speed: number
  heading?: number
  hosPct: number
  hosRemaining: string
  hosColor: 'green' | 'yellow' | 'red'
  currentTicket?: FleetTicketRef
  dispatch: FleetDispatchEntry[]
  scheduledHold: FleetTicketRef[]
}

export interface FleetTicketRef {
  id: number
  summary: string
  priority: string
  company?: string
}

export interface FleetDispatchEntry {
  id: number
  name: string
  start: string
  end: string
  type: EntryType
  status?: string
}

export interface FleetData {
  ok: boolean
  techs: FleetTech[]
  schedHoldTickets: ScheduleHoldTicket[]
  lastSync: string
}

export interface ScheduleHoldTicket {
  id: number
  summary: string
  company: string
  priority: string
  member: string
  dateEntered: string
}

// ── Analytics ────────────────────────────────────

export interface AnalyticsKpis {
  openTickets: { total: number; byBoard: Record<string, number> }
  inProgress: number
  highCritical: number
  multiTech: number
}

export interface AnalyticsData {
  ok: boolean
  kpis: AnalyticsKpis
  statusBreakdown: Array<{ status: string; count: number }>
  priorityBreakdown: Array<{ priority: string; count: number; color: string }>
  techWorkload: Array<{ name: string; count: number }>
}

// ── Samsara API Response Types ───────────────────

export interface SamsaraVehicle {
  id: string
  name: string
  vin?: string
  make?: string
  model?: string
  year?: number
  licensePlate?: string
  serial?: string
}

export interface SamsaraVehicleLocation {
  id: string
  name: string
  latitude: number
  longitude: number
  speed: number
  heading: number
  time: string
}

export interface SamsaraDriver {
  id: string
  name: string
  username?: string
  phone?: string
  vehicleId?: string
  vehicleName?: string
}

export interface SamsaraHosClock {
  driverId: string
  driverName: string
  driveTimeRemainingMs: number
  shiftTimeRemainingMs: number
  cycleTimeRemainingMs: number
  breakTimeRemainingMs: number
  dutyStatus: string
}

// ── Fleet Trails ────────────────────────────────

export interface FleetTrailPoint {
  lat: number
  lng: number
  speed: number
  heading: number
  time: string
}

export interface FleetTrail {
  vehicleId: string
  vehicleName: string
  points: FleetTrailPoint[]
}

export interface FleetTrailsResponse {
  ok: boolean
  trails: FleetTrail[]
  windowStart: string
  windowEnd: string
}

export interface SamsaraLocationHistoryPoint {
  latitude: number
  longitude: number
  speedMph: number
  headingDegrees: number
  time: string
}

export interface SamsaraLocationHistoryEntry {
  vehicleId: string
  vehicleName: string
  points: SamsaraLocationHistoryPoint[]
}

// ── Filter / UI State ────────────────────────────

export type TechFilter = 'all' | 'critical' | 'high' | 'inProgress' | 'multiTech' | 'lowHos'
export type EntryType = 'On-Site' | 'Remote' | 'Meeting' | 'Schedule Hold' | 'Recurring'

export type ScheduleHoldSort = 'priority' | 'dateEntered' | 'company'
