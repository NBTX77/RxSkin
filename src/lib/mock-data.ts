// ============================================================
// Mock Data — Used when CW credentials are not configured
// ============================================================

import type { Ticket, ScheduleEntry, Member, TicketNote, TimeEntry } from '@/types'

const COMPANIES = [
  'Meridian Healthcare', 'Apex Financial Group', 'Summit Legal Partners',
  'Cascade Manufacturing', 'Lighthouse Education', 'Pinnacle Engineering',
  'Redwood Properties', 'Sterling Insurance', 'Vantage Media', 'Atlas Logistics',
]

const CONTACTS = [
  'Sarah Mitchell', 'James Chen', 'Maria Rodriguez', 'David Okafor',
  'Lisa Thompson', 'Michael Park', 'Emma Williams', 'Robert Singh',
]

const TECHS: Member[] = [
  { id: 1, identifier: 'TBrown', name: 'Travis Brown', email: 'travis@rxtechnology.com', title: 'Lead Engineer' },
  { id: 2, identifier: 'JSmith', name: 'Jake Smith', email: 'jake@rxtechnology.com', title: 'Systems Engineer' },
  { id: 3, identifier: 'AJones', name: 'Amanda Jones', email: 'amanda@rxtechnology.com', title: 'Network Engineer' },
  { id: 4, identifier: 'CWilson', name: 'Chris Wilson', email: 'chris@rxtechnology.com', title: 'Help Desk' },
]

const SUMMARIES = [
  'Outlook not syncing emails on new laptop',
  'VPN connection drops intermittently',
  'Printer jam - HP LaserJet Pro M404',
  'New employee onboarding - John Davis',  'Server 2019 - high CPU usage on DC01',
  'Firewall rule change request - allow port 8443',
  'Microsoft Teams audio issues in conference room',
  'Backup job failed - Datto SIRIS',
  'Website SSL certificate expiring next week',
  'QuickBooks cannot connect to database',
  'WiFi dead spots on 3rd floor',
  'Meraki switch stack - firmware update needed',
  'Shared drive permissions - Marketing folder',
  'Email quarantine - false positive from client',
  'Azure AD sync error - duplicate attributes',
  'Monitor flickering on dual-screen setup',
  'Password reset - locked out of domain account',
  'SentinelOne alert - suspicious PowerShell script',
  'Phone system voicemail not recording',
  'Slow internet - bandwidth investigation needed',
  'New workstation deployment - Accounting dept',
  'RDP gateway certificate renewal',
  'Spam filter tuning - too many false positives',
  'UPS battery replacement - server room',
]

const STATUSES = ['New', 'In Progress', 'Waiting on Client', 'Scheduled', 'Resolved']
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low']
const BOARDS = ['Service Board', 'Projects', 'Internal']

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600 * 1000).toISOString()
}

function todayAt(hour: number, min = 0): string {  const d = new Date()
  d.setHours(hour, min, 0, 0)
  return d.toISOString()
}

let seed = 42
function seededRandom(): number {
  seed = (seed * 16807 + 0) % 2147483647
  return (seed - 1) / 2147483646
}
function seededFrom<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)]
}

export function getMockTickets(): Ticket[] {
  seed = 42
  return SUMMARIES.map((summary, i) => {
    const id = 100200 + i
    const status = seededFrom(STATUSES)
    const priority = seededFrom(PRIORITIES)
    const tech = seededFrom(TECHS)
    const company = seededFrom(COMPANIES)
    const hoursBack = Math.floor(seededRandom() * 72) + 1
    return {
      id, summary, status,
      statusId: STATUSES.indexOf(status) + 1,
      priority,
      priorityId: PRIORITIES.indexOf(priority) + 1,
      board: seededFrom(BOARDS), boardId: 1,      company, companyId: i + 1,
      contact: seededFrom(CONTACTS), contactId: i + 1,
      assignedTo: tech.name, assignedToId: tech.identifier,
      budgetHours: Math.floor(seededRandom() * 4) + 1,
      actualHours: parseFloat((seededRandom() * 3).toFixed(1)),
      createdAt: hoursAgo(hoursBack),
      updatedAt: hoursAgo(Math.floor(hoursBack * 0.3)),
      closedAt: status === 'Resolved' ? hoursAgo(1) : undefined,
      resources: [{ memberId: tech.id, memberName: tech.name, primaryFlag: true }],
    }
  })
}

export function getMockTicketById(id: number): Ticket | undefined {
  return getMockTickets().find(t => t.id === id)
}

export function getMockMembers(): Member[] {
  return TECHS
}

export function getMockNotes(ticketId: number): TicketNote[] {
  return [
    { id: 1, ticketId, text: 'Reached out to the client for more details. They said it started after the last Windows update.', isInternal: false, createdBy: 'Travis Brown', createdAt: hoursAgo(4) },
    { id: 2, ticketId, text: 'Checked event logs — found repeated errors in Application log. Likely related to the .NET runtime update.', isInternal: true, createdBy: 'Jake Smith', createdAt: hoursAgo(2) },
    { id: 3, ticketId, text: 'Applied KB5034441 fix and rebooted. Monitoring for recurrence.', isInternal: false, createdBy: 'Travis Brown', createdAt: hoursAgo(1) },
  ]
}

export function getMockTimeEntries(ticketId: number): TimeEntry[] {  return [
    { id: 1, ticketId, memberId: 1, memberName: 'Travis Brown', hoursWorked: 0.5, workType: 'Remote', notes: 'Initial triage and client call', billable: true, date: hoursAgo(4) },
    { id: 2, ticketId, memberId: 2, memberName: 'Jake Smith', hoursWorked: 1.0, workType: 'Remote', notes: 'Log analysis and patch research', billable: true, date: hoursAgo(2) },
  ]
}

export function getMockScheduleEntries(): ScheduleEntry[] {
  return [
    { id: 1, ticketId: 100200, ticketSummary: SUMMARIES[0], memberId: 1, memberName: 'Travis Brown', start: todayAt(8, 0), end: todayAt(9, 0), status: 'Scheduled', type: 'Service', companyId: 1, companyName: COMPANIES[0] },
    { id: 2, ticketId: 100204, ticketSummary: SUMMARIES[4], memberId: 1, memberName: 'Travis Brown', start: todayAt(9, 30), end: todayAt(11, 0), status: 'Scheduled', type: 'Service', companyId: 5, companyName: COMPANIES[4] },
    { id: 3, ticketId: 100207, ticketSummary: SUMMARIES[7], memberId: 1, memberName: 'Travis Brown', start: todayAt(13, 0), end: todayAt(14, 30), status: 'Scheduled', type: 'Service', companyId: 8, companyName: COMPANIES[7] },
    { id: 4, ticketId: 100210, ticketSummary: SUMMARIES[10], memberId: 2, memberName: 'Jake Smith', start: todayAt(8, 0), end: todayAt(10, 0), status: 'Scheduled', type: 'Service', companyId: 3, companyName: COMPANIES[2] },
    { id: 5, ticketId: 100215, ticketSummary: SUMMARIES[15], memberId: 2, memberName: 'Jake Smith', start: todayAt(10, 30), end: todayAt(12, 0), status: 'Scheduled', type: 'Service', companyId: 6, companyName: COMPANIES[5] },
    { id: 6, ticketId: 100218, ticketSummary: SUMMARIES[18], memberId: 3, memberName: 'Amanda Jones', start: todayAt(9, 0), end: todayAt(11, 0), status: 'Scheduled', type: 'Service', companyId: 9, companyName: COMPANIES[8] },
  ]
}