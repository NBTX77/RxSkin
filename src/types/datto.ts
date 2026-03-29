// ============================================================
// Datto BCDR + SaaS Protection TypeScript Types — RX Skin
// ============================================================

// ── BCDR Devices ────────────────────────────────────────────

export interface DattoDevice {
  serialNumber: string
  name: string
  model: string
  internalIP: string
  clientCompanyName: string
  registrationDate: string
  lastSeenDate: string
  hidden: boolean
  alertCount: number
  agentCount: number
  localStorageUsed: {
    size: number
    units: string
  }
  localStorageAvailable: {
    size: number
    units: string
  }
  offsiteStorageUsed: {
    size: number
    units: string
  }
  uptime: number  // seconds
  usedPorts: string[]
  activeTickets: number[]
  resellerCompanyName?: string
  lastAuditDate?: string
}

// ── BCDR Agents ─────────────────────────────────────────────

export interface DattoAgent {
  name: string
  agentVersion: string
  os: string
  protectedVolumesCount: number
  unprotectedVolumesCount: number
  type: 'agent' | 'share'
  isPaused: boolean
  isArchived: boolean
  latestOffsite: string | null
  localSnapshots: number
  lastSnapshot: string | null
  lastScreenshotUrl: string | null
  lastScreenshotAttempt: string | null
  lastScreenshotAttemptStatus: boolean | null
  backupVolumes: DattoVolume[]
  // Parent device reference
  deviceSerialNumber: string
  deviceName: string
}

// ── BCDR Volumes ────────────────────────────────────────────

export interface DattoVolume {
  name: string
  filesystem: string
  sizeInBytes: number
  usedInBytes: number
  isProtected: boolean
}

// ── BCDR Alerts ─────────────────────────────────────────────

export interface DattoAlert {
  alertType: string
  threshold: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  timestamp: string
  isResolved: boolean
  // Parent device reference
  deviceSerialNumber: string
  deviceName: string
  clientCompanyName: string
}

// ── BCDR Shares ─────────────────────────────────────────────

export interface DattoShare {
  name: string
  localIp: string
  sizeInBytes: number
  usedInBytes: number
  isPaused: boolean
  isArchived: boolean
  latestOffsite: string | null
  lastSnapshot: string | null
  // Parent device
  deviceSerialNumber: string
  deviceName: string
}

// ── BCDR VM Restores ────────────────────────────────────────

export interface DattoVMRestore {
  timestamp: string
  localHost: string
  agentName: string
  pointInTime: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  type: 'local' | 'cloud'
  // Parent device
  deviceSerialNumber: string
  deviceName: string
}

// ── BCDR Activity Log ───────────────────────────────────────

export interface DattoActivityLog {
  action: string
  user: string
  clientCompanyName: string
  timestamp: string
  details?: string
}

// ── SaaS Protection ─────────────────────────────────────────

export interface DattoSaaSCustomer {
  id: number
  name: string
  seatsUsed: number
  seatsAvailable: number
  applicationsCount: number
  domain: string
  lastBackupDate: string | null
  saasType: 'microsoft365' | 'google_workspace'
}

export interface DattoSaaSDomain {
  id: number
  domain: string
  customerName: string
  saasType: 'microsoft365' | 'google_workspace'
  totalSeats: number
  activeSeats: number
  lastBackupDate: string | null
  protectionStatus: 'protected' | 'partial' | 'unprotected'
}

export interface DattoSaaSSeat {
  id: string
  email: string
  displayName: string
  isEnabled: boolean
  lastBackupDate: string | null
  storageUsedBytes: number
  applicationsProtected: string[]
}

export interface DattoSaaSApplication {
  id: number
  type: 'exchange' | 'onedrive' | 'sharepoint' | 'teams' | 'gmail' | 'gdrive' | 'contacts' | 'calendar'
  customerName: string
  domain: string
  totalSeats: number
  protectedSeats: number
  lastBackupDate: string | null
  storageUsedBytes: number
}

// ── Dashboard Summary ───────────────────────────────────────

export interface DattoDashboardSummary {
  bcdr: {
    totalDevices: number
    onlineDevices: number
    offlineDevices: number
    totalAgents: number
    activeAlerts: number
    criticalAlerts: number
    warningAlerts: number
    totalLocalStorageGB: number
    usedLocalStorageGB: number
    totalOffsiteStorageGB: number
    lastBackupSuccessRate: number // percentage
    activeVMRestores: number
  }
  saas: {
    totalCustomers: number
    totalSeats: number
    protectedSeats: number
    totalApplications: number
    lastBackupDate: string | null
    m365Customers: number
    googleCustomers: number
  }
}

// ── Credential Types ────────────────────────────────────────

export interface DattoCredentials {
  baseUrl: string     // default: https://api.datto.com/v1
  publicKey: string
  privateKey: string
}

// ── API Response Wrappers ───────────────────────────────────

export interface DattoPaginatedResponse<T> {
  pagination: {
    page: number
    perPage: number
    totalPages: number
    count: number
  }
  items: T[]
}

// ── Config ──────────────────────────────────────────────────

export interface DattoIntegrationConfig {
  enabled: boolean
  dataMode: 'live' | 'demo'
  credentials?: DattoCredentials
}
