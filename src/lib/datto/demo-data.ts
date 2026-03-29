// ============================================================
// Datto BCDR + SaaS Demo Data — RX Skin
// Realistic mock data for demo mode. Used when dataMode = 'demo'.
// ============================================================

import type {
  DattoDevice,
  DattoAgent,
  DattoAlert,

  DattoVMRestore,
  DattoActivityLog,
  DattoSaaSCustomer,
  DattoSaaSDomain,
  DattoSaaSApplication,
  DattoDashboardSummary,
} from '@/types/datto'

// ── Helper ──────────────────────────────────────────────────

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString()
}
function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400_000).toISOString()
}

// ── BCDR Devices ────────────────────────────────────────────

export const demoDevices: DattoDevice[] = [
  {
    serialNumber: 'S1000-ABC1234',
    name: 'SIRIS-RXT-HQ',
    model: 'Datto SIRIS 5 X1',
    internalIP: '192.168.1.50',
    clientCompanyName: 'RX Technology',
    registrationDate: '2024-06-15T00:00:00Z',
    lastSeenDate: hoursAgo(0.5),
    hidden: false,
    alertCount: 1,
    agentCount: 12,
    localStorageUsed: { size: 2.8, units: 'TB' },
    localStorageAvailable: { size: 5.0, units: 'TB' },
    offsiteStorageUsed: { size: 4.2, units: 'TB' },
    uptime: 86400 * 47,
    usedPorts: ['443', '22'],
    activeTickets: [],
    lastAuditDate: hoursAgo(6),
  },
  {
    serialNumber: 'S1000-DEF5678',
    name: 'ALTO-SUMMIT-MED',
    model: 'Datto ALTO 4',
    internalIP: '10.0.2.25',
    clientCompanyName: 'Summit Medical Group',
    registrationDate: '2024-09-20T00:00:00Z',
    lastSeenDate: hoursAgo(0.2),
    hidden: false,
    alertCount: 0,
    agentCount: 6,
    localStorageUsed: { size: 890, units: 'GB' },
    localStorageAvailable: { size: 2.0, units: 'TB' },
    offsiteStorageUsed: { size: 1.4, units: 'TB' },
    uptime: 86400 * 92,
    usedPorts: ['443'],
    activeTickets: [],
    lastAuditDate: hoursAgo(12),
  },
  {
    serialNumber: 'S1000-GHI9012',
    name: 'SIRIS-OAKVIEW-LAW',
    model: 'Datto SIRIS 5 X2',
    internalIP: '192.168.10.15',
    clientCompanyName: 'Oakview Legal Partners',
    registrationDate: '2023-11-01T00:00:00Z',
    lastSeenDate: hoursAgo(72),
    hidden: false,
    alertCount: 3,
    agentCount: 8,
    localStorageUsed: { size: 3.6, units: 'TB' },
    localStorageAvailable: { size: 4.0, units: 'TB' },
    offsiteStorageUsed: { size: 5.8, units: 'TB' },
    uptime: 0,
    usedPorts: [],
    activeTickets: [4521],
    lastAuditDate: daysAgo(3),
  },
  {
    serialNumber: 'S1000-JKL3456',
    name: 'ALTO-COASTAL-CPA',
    model: 'Datto ALTO 4',
    internalIP: '172.16.0.30',
    clientCompanyName: 'Coastal CPA',
    registrationDate: '2025-01-10T00:00:00Z',
    lastSeenDate: hoursAgo(0.1),
    hidden: false,
    alertCount: 0,
    agentCount: 4,
    localStorageUsed: { size: 420, units: 'GB' },
    localStorageAvailable: { size: 2.0, units: 'TB' },
    offsiteStorageUsed: { size: 680, units: 'GB' },
    uptime: 86400 * 15,
    usedPorts: ['443'],
    activeTickets: [],
    lastAuditDate: hoursAgo(4),
  },
  {
    serialNumber: 'S1000-MNO7890',
    name: 'SIRIS-PINNACLE-RE',
    model: 'Datto SIRIS 5 X1',
    internalIP: '10.10.1.100',
    clientCompanyName: 'Pinnacle Real Estate',
    registrationDate: '2024-03-22T00:00:00Z',
    lastSeenDate: hoursAgo(1),
    hidden: false,
    alertCount: 2,
    agentCount: 9,
    localStorageUsed: { size: 1.9, units: 'TB' },
    localStorageAvailable: { size: 3.0, units: 'TB' },
    offsiteStorageUsed: { size: 3.1, units: 'TB' },
    uptime: 86400 * 63,
    usedPorts: ['443', '22'],
    activeTickets: [],
    lastAuditDate: hoursAgo(2),
  },
  {
    serialNumber: 'CLOUD-PQR1234',
    name: 'CLOUD-BRIGHT-EDU',
    model: 'Datto Cloud (Azure)',
    internalIP: 'N/A',
    clientCompanyName: 'Bright Horizons Academy',
    registrationDate: '2025-06-01T00:00:00Z',
    lastSeenDate: hoursAgo(0.3),
    hidden: false,
    alertCount: 0,
    agentCount: 3,
    localStorageUsed: { size: 0, units: 'GB' },
    localStorageAvailable: { size: 0, units: 'GB' },
    offsiteStorageUsed: { size: 1.2, units: 'TB' },
    uptime: 86400 * 120,
    usedPorts: [],
    activeTickets: [],
    lastAuditDate: hoursAgo(1),
  },
]

// ── BCDR Agents ─────────────────────────────────────────────

export const demoAgents: DattoAgent[] = [
  {
    name: 'DC01 (Domain Controller)',
    agentVersion: '3.1.2.205',
    os: 'Windows Server 2022 Standard',
    protectedVolumesCount: 2,
    unprotectedVolumesCount: 0,
    type: 'agent',
    isPaused: false,
    isArchived: false,
    latestOffsite: hoursAgo(4),
    localSnapshots: 288,
    lastSnapshot: hoursAgo(0.5),
    lastScreenshotUrl: null,
    lastScreenshotAttempt: hoursAgo(0.5),
    lastScreenshotAttemptStatus: true,
    backupVolumes: [
      { name: 'C:', filesystem: 'NTFS', sizeInBytes: 107_374_182_400, usedInBytes: 42_949_672_960, isProtected: true },
      { name: 'D:', filesystem: 'NTFS', sizeInBytes: 214_748_364_800, usedInBytes: 85_899_345_920, isProtected: true },
    ],
    deviceSerialNumber: 'S1000-ABC1234',
    deviceName: 'SIRIS-RXT-HQ',
  },
  {
    name: 'FS01 (File Server)',
    agentVersion: '3.1.2.205',
    os: 'Windows Server 2019 Standard',
    protectedVolumesCount: 3,
    unprotectedVolumesCount: 0,
    type: 'agent',
    isPaused: false,
    isArchived: false,
    latestOffsite: hoursAgo(3),
    localSnapshots: 288,
    lastSnapshot: hoursAgo(0.5),
    lastScreenshotUrl: null,
    lastScreenshotAttempt: hoursAgo(0.5),
    lastScreenshotAttemptStatus: true,
    backupVolumes: [
      { name: 'C:', filesystem: 'NTFS', sizeInBytes: 107_374_182_400, usedInBytes: 32_212_254_720, isProtected: true },
      { name: 'E:', filesystem: 'NTFS', sizeInBytes: 1_099_511_627_776, usedInBytes: 659_706_976_666, isProtected: true },
      { name: 'F:', filesystem: 'NTFS', sizeInBytes: 536_870_912_000, usedInBytes: 322_122_547_200, isProtected: true },
    ],
    deviceSerialNumber: 'S1000-ABC1234',
    deviceName: 'SIRIS-RXT-HQ',
  },
  {
    name: 'SQL01 (SQL Server)',
    agentVersion: '3.1.1.190',
    os: 'Windows Server 2022 Standard',
    protectedVolumesCount: 2,
    unprotectedVolumesCount: 1,
    type: 'agent',
    isPaused: false,
    isArchived: false,
    latestOffsite: hoursAgo(6),
    localSnapshots: 144,
    lastSnapshot: hoursAgo(1),
    lastScreenshotUrl: null,
    lastScreenshotAttempt: hoursAgo(1),
    lastScreenshotAttemptStatus: false,
    backupVolumes: [
      { name: 'C:', filesystem: 'NTFS', sizeInBytes: 107_374_182_400, usedInBytes: 53_687_091_200, isProtected: true },
      { name: 'D:', filesystem: 'NTFS', sizeInBytes: 536_870_912_000, usedInBytes: 429_496_729_600, isProtected: true },
      { name: 'T:', filesystem: 'NTFS', sizeInBytes: 107_374_182_400, usedInBytes: 21_474_836_480, isProtected: false },
    ],
    deviceSerialNumber: 'S1000-ABC1234',
    deviceName: 'SIRIS-RXT-HQ',
  },
  {
    name: 'WEB-SUMMIT (IIS)',
    agentVersion: '3.1.2.205',
    os: 'Windows Server 2019 Standard',
    protectedVolumesCount: 1,
    unprotectedVolumesCount: 0,
    type: 'agent',
    isPaused: false,
    isArchived: false,
    latestOffsite: hoursAgo(2),
    localSnapshots: 288,
    lastSnapshot: hoursAgo(0.25),
    lastScreenshotUrl: null,
    lastScreenshotAttempt: hoursAgo(0.25),
    lastScreenshotAttemptStatus: true,
    backupVolumes: [
      { name: 'C:', filesystem: 'NTFS', sizeInBytes: 107_374_182_400, usedInBytes: 64_424_509_440, isProtected: true },
    ],
    deviceSerialNumber: 'S1000-DEF5678',
    deviceName: 'ALTO-SUMMIT-MED',
  },
  {
    name: 'OAKVIEW-DC01',
    agentVersion: '3.0.9.180',
    os: 'Windows Server 2016 Standard',
    protectedVolumesCount: 2,
    unprotectedVolumesCount: 0,
    type: 'agent',
    isPaused: false,
    isArchived: false,
    latestOffsite: daysAgo(3),
    localSnapshots: 96,
    lastSnapshot: daysAgo(3),
    lastScreenshotUrl: null,
    lastScreenshotAttempt: daysAgo(3),
    lastScreenshotAttemptStatus: false,
    backupVolumes: [
      { name: 'C:', filesystem: 'NTFS', sizeInBytes: 107_374_182_400, usedInBytes: 75_161_927_680, isProtected: true },
      { name: 'D:', filesystem: 'NTFS', sizeInBytes: 268_435_456_000, usedInBytes: 214_748_364_800, isProtected: true },
    ],
    deviceSerialNumber: 'S1000-GHI9012',
    deviceName: 'SIRIS-OAKVIEW-LAW',
  },
]

// ── BCDR Alerts ─────────────────────────────────────────────

export const demoAlerts: DattoAlert[] = [
  {
    alertType: 'offsite_sync_failed',
    threshold: '24 hours',
    severity: 'critical',
    message: 'Offsite sync has not completed in over 72 hours. Last successful sync: 3 days ago.',
    timestamp: daysAgo(3),
    isResolved: false,
    deviceSerialNumber: 'S1000-GHI9012',
    deviceName: 'SIRIS-OAKVIEW-LAW',
    clientCompanyName: 'Oakview Legal Partners',
  },
  {
    alertType: 'device_offline',
    threshold: '1 hour',
    severity: 'critical',
    message: 'Device has been offline for 72+ hours. Last contact was 3 days ago.',
    timestamp: daysAgo(3),
    isResolved: false,
    deviceSerialNumber: 'S1000-GHI9012',
    deviceName: 'SIRIS-OAKVIEW-LAW',
    clientCompanyName: 'Oakview Legal Partners',
  },
  {
    alertType: 'screenshot_failed',
    threshold: 'consecutive',
    severity: 'warning',
    message: 'Screenshot verification failed for SQL01 — last 3 attempts unsuccessful.',
    timestamp: hoursAgo(1),
    isResolved: false,
    deviceSerialNumber: 'S1000-ABC1234',
    deviceName: 'SIRIS-RXT-HQ',
    clientCompanyName: 'RX Technology',
  },
  {
    alertType: 'storage_warning',
    threshold: '85%',
    severity: 'warning',
    message: 'Local storage usage is at 90%. Consider archiving old snapshots or expanding storage.',
    timestamp: hoursAgo(6),
    isResolved: false,
    deviceSerialNumber: 'S1000-GHI9012',
    deviceName: 'SIRIS-OAKVIEW-LAW',
    clientCompanyName: 'Oakview Legal Partners',
  },
  {
    alertType: 'backup_failed',
    threshold: '2 consecutive',
    severity: 'warning',
    message: 'Agent PINNACLE-FS02 has failed 2 consecutive backup attempts. Check disk space.',
    timestamp: hoursAgo(3),
    isResolved: false,
    deviceSerialNumber: 'S1000-MNO7890',
    deviceName: 'SIRIS-PINNACLE-RE',
    clientCompanyName: 'Pinnacle Real Estate',
  },
  {
    alertType: 'agent_update',
    threshold: '2 versions behind',
    severity: 'info',
    message: 'Agent on OAKVIEW-DC01 is 2 versions behind (3.0.9 → 3.1.2). Consider updating.',
    timestamp: daysAgo(1),
    isResolved: false,
    deviceSerialNumber: 'S1000-GHI9012',
    deviceName: 'SIRIS-OAKVIEW-LAW',
    clientCompanyName: 'Oakview Legal Partners',
  },
]

// ── VM Restores ─────────────────────────────────────────────

export const demoVMRestores: DattoVMRestore[] = [
  {
    timestamp: hoursAgo(2),
    localHost: 'SIRIS-RXT-HQ',
    agentName: 'SQL01 (SQL Server)',
    pointInTime: hoursAgo(6),
    status: 'running',
    type: 'local',
    deviceSerialNumber: 'S1000-ABC1234',
    deviceName: 'SIRIS-RXT-HQ',
  },
]

// ── Activity Log ────────────────────────────────────────────

export const demoActivityLog: DattoActivityLog[] = [
  { action: 'Backup completed', user: 'system', clientCompanyName: 'RX Technology', timestamp: hoursAgo(0.5), details: 'DC01 — C: and D: volumes' },
  { action: 'Offsite sync started', user: 'system', clientCompanyName: 'Summit Medical Group', timestamp: hoursAgo(1) },
  { action: 'Screenshot verification passed', user: 'system', clientCompanyName: 'RX Technology', timestamp: hoursAgo(0.5), details: 'DC01' },
  { action: 'Screenshot verification failed', user: 'system', clientCompanyName: 'RX Technology', timestamp: hoursAgo(1), details: 'SQL01 — OS did not boot' },
  { action: 'VM restore initiated', user: 'tbrown@rxtech.com', clientCompanyName: 'RX Technology', timestamp: hoursAgo(2), details: 'SQL01 local restore from 6hr snapshot' },
  { action: 'Alert triggered: device_offline', user: 'system', clientCompanyName: 'Oakview Legal Partners', timestamp: daysAgo(3) },
  { action: 'Agent updated', user: 'system', clientCompanyName: 'Coastal CPA', timestamp: daysAgo(1), details: '3.1.1 → 3.1.2' },
]

// ── SaaS Protection ─────────────────────────────────────────

export const demoSaaSCustomers: DattoSaaSCustomer[] = [
  {
    id: 1001,
    name: 'RX Technology',
    seatsUsed: 45,
    seatsAvailable: 50,
    applicationsCount: 4,
    domain: 'rxtech.com',
    lastBackupDate: hoursAgo(1),
    saasType: 'microsoft365',
  },
  {
    id: 1002,
    name: 'Summit Medical Group',
    seatsUsed: 28,
    seatsAvailable: 30,
    applicationsCount: 4,
    domain: 'summitmed.com',
    lastBackupDate: hoursAgo(2),
    saasType: 'microsoft365',
  },
  {
    id: 1003,
    name: 'Oakview Legal Partners',
    seatsUsed: 15,
    seatsAvailable: 20,
    applicationsCount: 3,
    domain: 'oakviewlaw.com',
    lastBackupDate: hoursAgo(3),
    saasType: 'microsoft365',
  },
  {
    id: 1004,
    name: 'Bright Horizons Academy',
    seatsUsed: 12,
    seatsAvailable: 15,
    applicationsCount: 3,
    domain: 'brighthorizons.edu',
    lastBackupDate: hoursAgo(4),
    saasType: 'google_workspace',
  },
  {
    id: 1005,
    name: 'Coastal CPA',
    seatsUsed: 8,
    seatsAvailable: 10,
    applicationsCount: 4,
    domain: 'coastalcpa.com',
    lastBackupDate: hoursAgo(1.5),
    saasType: 'microsoft365',
  },
]

export const demoSaaSDomains: DattoSaaSDomain[] = [
  { id: 2001, domain: 'rxtech.com', customerName: 'RX Technology', saasType: 'microsoft365', totalSeats: 50, activeSeats: 45, lastBackupDate: hoursAgo(1), protectionStatus: 'protected' },
  { id: 2002, domain: 'summitmed.com', customerName: 'Summit Medical Group', saasType: 'microsoft365', totalSeats: 30, activeSeats: 28, lastBackupDate: hoursAgo(2), protectionStatus: 'protected' },
  { id: 2003, domain: 'oakviewlaw.com', customerName: 'Oakview Legal Partners', saasType: 'microsoft365', totalSeats: 20, activeSeats: 15, lastBackupDate: hoursAgo(3), protectionStatus: 'partial' },
  { id: 2004, domain: 'brighthorizons.edu', customerName: 'Bright Horizons Academy', saasType: 'google_workspace', totalSeats: 15, activeSeats: 12, lastBackupDate: hoursAgo(4), protectionStatus: 'protected' },
  { id: 2005, domain: 'coastalcpa.com', customerName: 'Coastal CPA', saasType: 'microsoft365', totalSeats: 10, activeSeats: 8, lastBackupDate: hoursAgo(1.5), protectionStatus: 'protected' },
]

export const demoSaaSApplications: DattoSaaSApplication[] = [
  { id: 3001, type: 'exchange', customerName: 'RX Technology', domain: 'rxtech.com', totalSeats: 50, protectedSeats: 45, lastBackupDate: hoursAgo(1), storageUsedBytes: 53_687_091_200 },
  { id: 3002, type: 'onedrive', customerName: 'RX Technology', domain: 'rxtech.com', totalSeats: 50, protectedSeats: 45, lastBackupDate: hoursAgo(1), storageUsedBytes: 107_374_182_400 },
  { id: 3003, type: 'sharepoint', customerName: 'RX Technology', domain: 'rxtech.com', totalSeats: 50, protectedSeats: 45, lastBackupDate: hoursAgo(1.5), storageUsedBytes: 214_748_364_800 },
  { id: 3004, type: 'teams', customerName: 'RX Technology', domain: 'rxtech.com', totalSeats: 50, protectedSeats: 42, lastBackupDate: hoursAgo(2), storageUsedBytes: 32_212_254_720 },
  { id: 3005, type: 'exchange', customerName: 'Summit Medical Group', domain: 'summitmed.com', totalSeats: 30, protectedSeats: 28, lastBackupDate: hoursAgo(2), storageUsedBytes: 32_212_254_720 },
  { id: 3006, type: 'onedrive', customerName: 'Summit Medical Group', domain: 'summitmed.com', totalSeats: 30, protectedSeats: 28, lastBackupDate: hoursAgo(2), storageUsedBytes: 64_424_509_440 },
  { id: 3007, type: 'gmail', customerName: 'Bright Horizons Academy', domain: 'brighthorizons.edu', totalSeats: 15, protectedSeats: 12, lastBackupDate: hoursAgo(4), storageUsedBytes: 21_474_836_480 },
  { id: 3008, type: 'gdrive', customerName: 'Bright Horizons Academy', domain: 'brighthorizons.edu', totalSeats: 15, protectedSeats: 12, lastBackupDate: hoursAgo(4), storageUsedBytes: 42_949_672_960 },
]

// ── Dashboard Summary (computed from demo data) ─────────────

export function getDemoDashboardSummary(): DattoDashboardSummary {
  const onlineDevices = demoDevices.filter(d => {
    const lastSeen = new Date(d.lastSeenDate).getTime()
    return Date.now() - lastSeen < 3600_000 * 2 // seen in last 2 hours
  })

  const criticalAlerts = demoAlerts.filter(a => a.severity === 'critical' && !a.isResolved)
  const warningAlerts = demoAlerts.filter(a => a.severity === 'warning' && !a.isResolved)
  const activeAlerts = demoAlerts.filter(a => !a.isResolved)

  const totalAgents = demoDevices.reduce((sum, d) => sum + d.agentCount, 0)

  const m365Customers = demoSaaSCustomers.filter(c => c.saasType === 'microsoft365')
  const googleCustomers = demoSaaSCustomers.filter(c => c.saasType === 'google_workspace')
  const totalSeats = demoSaaSCustomers.reduce((sum, c) => sum + c.seatsAvailable, 0)
  const protectedSeats = demoSaaSCustomers.reduce((sum, c) => sum + c.seatsUsed, 0)

  return {
    bcdr: {
      totalDevices: demoDevices.length,
      onlineDevices: onlineDevices.length,
      offlineDevices: demoDevices.length - onlineDevices.length,
      totalAgents: totalAgents,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      warningAlerts: warningAlerts.length,
      totalLocalStorageGB: 16000,
      usedLocalStorageGB: 9710,
      totalOffsiteStorageGB: 20000,
      lastBackupSuccessRate: 94.2,
      activeVMRestores: demoVMRestores.filter(r => r.status === 'running').length,
    },
    saas: {
      totalCustomers: demoSaaSCustomers.length,
      totalSeats,
      protectedSeats,
      totalApplications: demoSaaSApplications.length,
      lastBackupDate: hoursAgo(1),
      m365Customers: m365Customers.length,
      googleCustomers: googleCustomers.length,
    },
  }
}
