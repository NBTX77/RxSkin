// ============================================================
// Fleet Data Merge — RX Skin
// Combines Samsara vehicle/driver/HOS data with CW tickets
// and schedule entries into a unified FleetTech[] array.
// Server-side only.
// ============================================================

import type {
  FleetTech,
  FleetDispatchEntry,
  FleetTicketRef,
  ScheduleHoldTicket,
  SamsaraVehicleLocation,
  SamsaraDriver,
  SamsaraHosClock,
} from '@/types/ops'
import type { Ticket, ScheduleEntry, Member } from '@/types'

/**
 * Format milliseconds into "Xh Ym" string.
 */
function msToHoursMinutes(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes}m`
}

/**
 * Determine HOS color based on remaining drive time.
 */
function hosColor(driveTimeRemainingMs: number): 'green' | 'yellow' | 'red' {
  const hoursRemaining = driveTimeRemainingMs / 3600000
  if (hoursRemaining < 2) return 'red'
  if (hoursRemaining < 4) return 'yellow'
  return 'green'
}
/**
 * Compute HOS percentage (out of 11-hour max drive time).
 */
function hosPct(driveTimeRemainingMs: number): number {
  const MAX_DRIVE_MS = 11 * 3600000
  return Math.round((driveTimeRemainingMs / MAX_DRIVE_MS) * 100)
}

/**
 * Convert a CW schedule entry into a FleetDispatchEntry.
 */
function toDispatchEntry(entry: ScheduleEntry): FleetDispatchEntry {
  const typeMap: Record<string, FleetDispatchEntry['type']> = {
    'On-Site': 'On-Site',
    'Remote': 'Remote',
    'Meeting': 'Meeting',
    'Schedule Hold': 'Schedule Hold',
    'Recurring': 'Recurring',
  }
  return {
    id: entry.id,
    name: entry.ticketSummary ?? `Schedule Entry #${entry.id}`,
    start: entry.start,
    end: entry.end,
    type: typeMap[entry.type] ?? 'On-Site',
    status: entry.status,
  }
}

/**
 * Convert a CW ticket into a FleetTicketRef.
 */
function toTicketRef(ticket: Ticket): FleetTicketRef {
  return {
    id: ticket.id,
    summary: ticket.summary,
    priority: ticket.priority,
    company: ticket.company,
  }
}

export interface MergeInput {
  locations: SamsaraVehicleLocation[]
  drivers: SamsaraDriver[]
  hosClocks: SamsaraHosClock[]
  members: Member[]
  tickets: Ticket[]
  scheduleEntries: ScheduleEntry[]
}
export interface MergeOutput {
  techs: FleetTech[]
  schedHoldTickets: ScheduleHoldTicket[]
}

/**
 * Merge Samsara fleet data with ConnectWise ticket/schedule data.
 * The merge key is driver name ↔ CW member name (fuzzy matched).
 */
export function mergeFleetData(input: MergeInput): MergeOutput {
  const { locations, drivers, hosClocks, members, tickets, scheduleEntries } = input

  // Build lookup maps
  const locationByVehicleId = new Map(locations.map((l) => [l.id, l]))
  const hosByDriverId = new Map(hosClocks.map((h) => [h.driverId, h]))

  // Build member lookup by name (lowercased) for fuzzy matching
  const memberByName = new Map(members.map((m) => [m.name.toLowerCase(), m]))
  const memberById = new Map(members.map((m) => [m.id, m]))

  // Group schedule entries by member ID
  const scheduleByMember = new Map<number, ScheduleEntry[]>()
  for (const entry of scheduleEntries) {
    const existing = scheduleByMember.get(entry.memberId) ?? []
    existing.push(entry)
    scheduleByMember.set(entry.memberId, existing)
  }

  // Group tickets by assigned member identifier
  const ticketsByMember = new Map<string, Ticket[]>()
  for (const ticket of tickets) {
    if (ticket.assignedToId) {
      const existing = ticketsByMember.get(ticket.assignedToId) ?? []
      existing.push(ticket)
      ticketsByMember.set(ticket.assignedToId, existing)
    }
  }

  // Build FleetTech array from Samsara drivers
  const techs: FleetTech[] = drivers.map((driver) => {
    const location = driver.vehicleId
      ? locationByVehicleId.get(driver.vehicleId)
      : undefined
    const hos = hosByDriverId.get(driver.id)

    // Find CW member matching this Samsara driver
    const cwMember = memberByName.get(driver.name.toLowerCase())
    const memberSchedule = cwMember
      ? scheduleByMember.get(cwMember.id) ?? []
      : []
    const memberTickets = cwMember
      ? ticketsByMember.get(cwMember.identifier) ?? []
      : []

    // Find active/current ticket (first in-progress or today's first dispatch)
    const activeTicket = memberTickets.find(
      (t) => t.status === 'In Progress'
    )

    return {
      id: driver.id,
      name: driver.name,
      memberId: cwMember?.id ?? 0,
      memberIdentifier: cwMember?.identifier ?? '',
      truckName: driver.vehicleName ?? location?.name ?? 'Unknown',
      vehicleId: driver.vehicleId ?? '',
      lat: location?.latitude ?? 0,
      lng: location?.longitude ?? 0,
      speed: location ? Math.round(location.speed) : 0,
      heading: location?.heading,
      hosPct: hos ? hosPct(hos.driveTimeRemainingMs) : 100,
      hosRemaining: hos ? msToHoursMinutes(hos.driveTimeRemainingMs) : 'N/A',
      hosColor: hos ? hosColor(hos.driveTimeRemainingMs) : 'green',
      currentTicket: activeTicket ? toTicketRef(activeTicket) : undefined,
      dispatch: memberSchedule.map(toDispatchEntry),
      scheduledHold: memberTickets
        .filter((t) => t.status === 'Schedule Hold' || t.status === 'Scheduled')
        .map(toTicketRef),
    }
  })

  // Build Schedule Hold tickets list
  const schedHoldTickets: ScheduleHoldTicket[] = tickets
    .filter((t) => t.status === 'Schedule Hold' || t.status === 'Scheduled')
    .map((t) => ({
      id: t.id,
      summary: t.summary,
      company: t.company,
      priority: t.priority,
      member: t.assignedTo ?? 'Unassigned',
      dateEntered: t.createdAt,
    }))

  return { techs, schedHoldTickets }
}
/**
 * Generate mock fleet data for development without Samsara credentials.
 */
export function getMockFleetData(): MergeOutput {
  const mockTechs: FleetTech[] = [
    {
      id: 'driver-1',
      name: 'Marcus Johnson',
      memberId: 1,
      memberIdentifier: 'mjohnson',
      truckName: 'Van 12',
      vehicleId: 'v-001',
      lat: 30.2672,
      lng: -97.7431,
      speed: 45,
      heading: 180,
      hosPct: 72,
      hosRemaining: '5h 45m',
      hosColor: 'green',
      currentTicket: { id: 12345, summary: 'Network switch install', priority: 'High', company: 'ABC Corp' },
      dispatch: [
        { id: 1, name: 'Network Install - ABC Corp', start: '08:00', end: '12:00', type: 'On-Site', status: 'In Progress' },
        { id: 2, name: 'Firewall Config - XYZ Inc', start: '13:00', end: '15:00', type: 'Remote', status: 'Scheduled' },
      ],
      scheduledHold: [],
    },
    {
      id: 'driver-2',
      name: 'Sarah Chen',
      memberId: 2,
      memberIdentifier: 'schen',
      truckName: 'Van 07',
      vehicleId: 'v-002',
      lat: 30.2849,
      lng: -97.7341,
      speed: 0,
      heading: 90,
      hosPct: 35,
      hosRemaining: '3h 10m',
      hosColor: 'yellow',
      currentTicket: { id: 12346, summary: 'Server migration', priority: 'Critical', company: 'MegaCorp' },
      dispatch: [
        { id: 3, name: 'Server Migration - MegaCorp', start: '07:00', end: '16:00', type: 'On-Site', status: 'In Progress' },
      ],
      scheduledHold: [{ id: 12350, summary: 'Backup config review', priority: 'Medium', company: 'MegaCorp' }],
    },    {
      id: 'driver-3',
      name: 'James Rivera',
      memberId: 3,
      memberIdentifier: 'jrivera',
      truckName: 'Van 03',
      vehicleId: 'v-003',
      lat: 30.2500,
      lng: -97.7600,
      speed: 62,
      heading: 270,
      hosPct: 15,
      hosRemaining: '1h 20m',
      hosColor: 'red',
      currentTicket: undefined,
      dispatch: [
        { id: 4, name: 'Cabling - Delta LLC', start: '09:00', end: '11:00', type: 'On-Site', status: 'Completed' },
        { id: 5, name: 'WiFi Survey - Echo Partners', start: '14:00', end: '17:00', type: 'On-Site', status: 'Scheduled' },
      ],
      scheduledHold: [],
    },
    {
      id: 'driver-4',
      name: 'Lisa Park',
      memberId: 4,
      memberIdentifier: 'lpark',
      truckName: 'Van 09',
      vehicleId: 'v-004',
      lat: 30.3100,
      lng: -97.7200,
      speed: 30,
      heading: 45,
      hosPct: 88,
      hosRemaining: '8h 15m',
      hosColor: 'green',
      currentTicket: { id: 12347, summary: 'VPN setup', priority: 'Medium', company: 'Foxtrot Inc' },
      dispatch: [
        { id: 6, name: 'VPN Setup - Foxtrot Inc', start: '10:00', end: '12:00', type: 'Remote', status: 'In Progress' },
        { id: 7, name: 'Team Standup', start: '08:00', end: '08:30', type: 'Meeting', status: 'Completed' },
      ],
      scheduledHold: [],
    },
    {
      id: 'driver-5',
      name: 'David Kim',
      memberId: 5,
      memberIdentifier: 'dkim',
      truckName: 'Van 15',
      vehicleId: 'v-005',
      lat: 30.2350,
      lng: -97.7850,
      speed: 0,
      heading: 0,
      hosPct: 95,
      hosRemaining: '9h 50m',
      hosColor: 'green',
      currentTicket: { id: 12348, summary: 'Multi-site network deployment', priority: 'High', company: 'Global Systems' },
      dispatch: [
        { id: 8, name: 'Network Deploy - Global Systems', start: '08:00', end: '17:00', type: 'On-Site', status: 'In Progress' },
      ],
      scheduledHold: [{ id: 12351, summary: 'Phone system install', priority: 'Low', company: 'Quick Print' }],
    },
  ]

  const mockHolds: ScheduleHoldTicket[] = [
    { id: 67890, summary: 'Server migration phase 2', company: 'XYZ Inc', priority: 'High', member: 'mjohnson', dateEntered: '2026-03-20T10:00:00Z' },
    { id: 67891, summary: 'Firewall replacement', company: 'ABC Corp', priority: 'Critical', member: 'schen', dateEntered: '2026-03-18T14:00:00Z' },
    { id: 67892, summary: 'Desktop refresh (25 units)', company: 'Delta LLC', priority: 'Medium', member: 'Unassigned', dateEntered: '2026-03-22T09:00:00Z' },
    { id: 67893, summary: 'Security camera install', company: 'Echo Partners', priority: 'Low', member: 'jrivera', dateEntered: '2026-03-25T11:00:00Z' },
    { id: 67894, summary: 'Cloud backup migration', company: 'Foxtrot Inc', priority: 'High', member: 'lpark', dateEntered: '2026-03-19T08:00:00Z' },
  ]

  return { techs: mockTechs, schedHoldTickets: mockHolds }
}