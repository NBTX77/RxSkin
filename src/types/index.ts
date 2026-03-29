// ============================================================
// Core TypeScript Types — RX Skin
// ============================================================

// ── Tickets ──────────────────────────────────────────────────

export interface Ticket {
  id: number
  summary: string
  status: string
  statusId?: number
  priority: string
  priorityId?: number
  board: string
  boardId?: number
  company: string
  companyId?: number
  contact?: string
  contactId?: number
  assignedTo?: string
  assignedToId?: string
  budgetHours?: number
  actualHours?: number
  createdAt: string
  updatedAt: string
  closedAt?: string
  resources?: TicketResource[]
}

export interface TicketResource {
  memberId: number
  memberName: string
  primaryFlag: boolean
}

export interface TicketNote {
  id: number
  ticketId: number
  text: string
  isInternal: boolean
  createdBy: string
  createdAt: string
}

export interface TimeEntry {
  id: number
  ticketId: number
  memberId: number
  memberName: string
  hoursWorked: number
  workType?: string
  notes?: string
  billable: boolean
  date: string
}

// ── Filters ───────────────────────────────────────────────────

export interface TicketFilters {
  status?: string[]
  boardId?: number
  priority?: string[]
  assignedTo?: string
  companyId?: number
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  pageSize?: number
  /** Raw CW OData conditions to prepend (e.g. 'closedFlag=false') */
  conditions?: string
}

// ── Schedule ─────────────────────────────────────────────────

export interface ScheduleEntry {
  id: number
  ticketId?: number
  ticketSummary?: string
  memberId: number
  memberName: string
  start: string   // ISO 8601
  end: string     // ISO 8601
  status: string
  type: string
  companyId?: number
  companyName?: string
}

export interface ScheduleFilters {
  start: string
  end: string
  memberId?: number
}

// ── Companies ─────────────────────────────────────────────────

export interface Company {
  id: number
  name: string
  identifier: string
  type?: string
  status?: string
  phone?: string
  website?: string
  addressLine1?: string
  city?: string
  state?: string
  zip?: string
}

export interface Contact {
  id: number
  firstName: string
  lastName: string
  email?: string
  phone?: string
  title?: string
  companyId: number
  companyName: string
}

// ── Members (Technicians) ─────────────────────────────────────

export interface Member {
  id: number
  identifier: string
  name: string
  email?: string
  title?: string
  avatar?: string
  department?: DepartmentCode
  defaultDepartment?: string
}

// ── Departments ──────────────────────────────────────────────

export type DepartmentCode = 'IT' | 'SI' | 'AM' | 'GA' | 'LT'

const VALID_DEPT_CODES = new Set<string>(['IT', 'SI', 'AM', 'GA', 'LT'])

/** Type guard: validates a string is a valid DepartmentCode. */
export function isDepartmentCode(value: unknown): value is DepartmentCode {
  return typeof value === 'string' && VALID_DEPT_CODES.has(value)
}

/** Safely parse a string to DepartmentCode, returning fallback if invalid. */
export function parseDepartmentCode(value: unknown, fallback: DepartmentCode = 'IT'): DepartmentCode {
  return isDepartmentCode(value) ? value : fallback
}

export interface DepartmentConfig {
  code: DepartmentCode
  name: string
  label: string
  color: string
  cwDepartments: string[]   // CW department names that map to this RX dept
  cwBoards: string[]        // CW board names this dept sees
}

export const DEPARTMENTS: Record<DepartmentCode, DepartmentConfig> = {
  IT: {
    code: 'IT',
    name: 'IT',
    label: 'MSP & Engineers',
    color: 'blue',
    cwDepartments: ['IT', 'Streamline IT'],
    cwBoards: ['Managed Services', 'Engineering', 'Alerts / Monitoring ', 'IT Installations'],
  },
  SI: {
    code: 'SI',
    name: 'Systems Integration',
    label: 'Systems Integration',
    color: 'cyan',
    cwDepartments: ['Systems Integration'],
    cwBoards: ['Systems Integration (Service)', 'Systems Integration (Security) ', 'Systems Integration (Communication) '],
  },
  AM: {
    code: 'AM',
    name: 'Account Management',
    label: 'Account Management',
    color: 'green',
    cwDepartments: ['Sales'],
    cwBoards: ['Opportunities'],
  },
  GA: {
    code: 'GA',
    name: 'G&A',
    label: 'Accounting & Procurement',
    color: 'orange',
    cwDepartments: ['G&A'],
    cwBoards: ['Procurement '],
  },
  LT: {
    code: 'LT',
    name: 'Leadership',
    label: 'Leadership Team',
    color: 'purple',
    cwDepartments: [],  // LT sees all departments
    cwBoards: [],       // LT sees all boards
  },
}

/** Map a CW department name to an RX department code */
export function cwDeptToRxDept(cwDeptName: string | undefined): DepartmentCode {
  if (!cwDeptName) return 'IT'  // default
  for (const [code, config] of Object.entries(DEPARTMENTS)) {
    if (isDepartmentCode(code) && config.cwDepartments.includes(cwDeptName)) {
      return code
    }
  }
  return 'IT'  // fallback
}

// ── Projects ──────────────────────────────────────────────────

export interface Project {
  id: number
  name: string
  status: string
  statusId?: number
  board: string
  boardId?: number
  department?: DepartmentCode
  company: string
  companyId?: number
  manager?: string
  managerId?: string
  estimatedStart?: string
  estimatedEnd?: string
  actualStart?: string
  actualEnd?: string
  budgetHours: number
  actualHours: number
  billingMethod?: string
  closedFlag?: boolean
}

export interface ProjectFilters {
  board?: string
  status?: string
  managerId?: string
  companyId?: number
  department?: DepartmentCode
  cwDepartments?: string[]  // CW department names for OR-based filtering
  closedFlag?: boolean
  search?: string
}

// ── API Response Types ────────────────────────────────────────

export interface ApiError {
  code: string
  message: string
  retryable: boolean
  retryAfter?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ── Auth ──────────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'TECH' | 'VIEWER'

const VALID_ROLES = new Set<string>(['ADMIN', 'TECH', 'VIEWER'])

/** Type guard: validates a string is a valid UserRole. */
export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && VALID_ROLES.has(value)
}

/** Safely parse a string to UserRole, returning fallback if invalid. */
export function parseUserRole(value: unknown, fallback: UserRole = 'VIEWER'): UserRole {
  return isUserRole(value) ? value : fallback
}

export interface SessionUser {
  id: string
  email: string
  name: string
  tenantId: string
  role: UserRole
  cwMemberId?: string
  department: DepartmentCode
}

// ── Date / View ───────────────────────────────────────────────

export type CalendarView = 'day' | 'week' | 'twoWeek' | 'month' | 'agenda'

export interface DateRange {
  start: string
  end: string
}

// ── Automate (RMM) ──────────────────────────────────────────

export interface AutomateComputer {
  id: number
  computerName: string
  clientName: string
  clientId: number
  locationName: string
  status: 'Online' | 'Offline' | string
  operatingSystem: string
  localIP: string
  lastContact: string
  lastHeartbeat: string
  cpuUsage: number
  totalMemoryGB: number
  freeMemoryGB: number
  type: 'Server' | 'Workstation' | 'Laptop' | string
  isRebootNeeded: boolean
  domain: string
  lastUserName: string
  serialNumber: string
  biosManufacturer: string
  systemUptimeDays: number
  antivirusName: string
  antivirusDefDate: string
  windowsUpdateDate: string
  tempFiles: string
  macAddress: string
}

export interface AutomateScript {
  id: number
  name: string
  description: string
  folder: string
  hasParameters: boolean
  parameters: string[]
}

export interface ScriptRunResult {
  scriptId: number
  computerId: number
  status: 'queued' | 'running' | 'success' | 'failed'
  message?: string
}

// ── ScreenConnect / ConnectWise Control ───────────────────────

export interface ScreenConnectSession {
  sessionId: string
  name: string
  hostName: string
  isOnline: boolean
  lastConnected: string
  guestOperatingSystemName?: string
  guestMachineName?: string
}

export interface ScreenConnectLaunchUrl {
  url: string
  sessionId: string
  computerName: string
}
