// ============================================================
// Meraki Dashboard API v1 — TypeScript Types
// Used by BFF client, API routes, and React components.
// ============================================================

// ── Organizations ───────────────────────────────────────────

export interface MerakiOrganization {
  id: string
  name: string
  url: string
  api?: { enabled: boolean }
  licensing?: { model: string }
  cloud?: { region: { name: string } }
}

// ── Networks ────────────────────────────────────────────────

export interface MerakiNetwork {
  id: string
  organizationId: string
  name: string
  productTypes: string[]
  timeZone: string
  tags: string[]
  enrollmentString?: string
  url: string
  isBoundToConfigTemplate: boolean
  configTemplateId?: string
}

// ── Devices ─────────────────────────────────────────────────

export interface MerakiDevice {
  serial: string
  name: string
  mac: string
  model: string
  networkId: string
  orderNumber?: string
  tags: string[]
  lat?: number
  lng?: number
  address?: string
  firmware: string
  url: string
  lanIp?: string
  wan1Ip?: string
  wan2Ip?: string
  floorPlanId?: string
}

export interface MerakiDeviceStatus {
  serial: string
  name: string
  mac: string
  model: string
  networkId: string
  status: 'online' | 'alerting' | 'offline' | 'dormant'
  lanIp?: string
  publicIp?: string
  productType: string
  lastReportedAt: string
  gateway?: string
  primaryDns?: string
  secondaryDns?: string
  usingCellularFailover?: boolean
}

// ── Uplinks ─────────────────────────────────────────────────

export interface MerakiUplinkStatus {
  serial: string
  model: string
  networkId: string
  highAvailability?: { enabled: boolean; role: string }
  uplinks: MerakiUplink[]
  lastReportedAt: string
}

export interface MerakiUplink {
  interface: string
  status: 'active' | 'ready' | 'connecting' | 'not connected' | 'failed'
  ip?: string
  gateway?: string
  publicIp?: string
  primaryDns?: string
  secondaryDns?: string
  ipAssignedBy?: string
  provider?: string
  signalType?: string
  connectionType?: string
}

// ── Wireless / SSIDs ────────────────────────────────────────

export interface MerakiSSID {
  number: number
  name: string
  enabled: boolean
  authMode: string
  encryptionMode?: string
  splashPage?: string
  bandSelection?: string
  visible: boolean
}

export interface MerakiWirelessClient {
  id: string
  mac: string
  description?: string
  ip?: string
  vlan?: number
  ssid?: string
  rssi?: number
  status: string
  usage: { sent: number; recv: number }
  firstSeen: string
  lastSeen: string
  manufacturer?: string
  os?: string
}

// ── Clients ─────────────────────────────────────────────────

export interface MerakiClient {
  id: string
  mac: string
  description?: string
  ip?: string
  ip6?: string
  user?: string
  firstSeen: string
  lastSeen: string
  manufacturer?: string
  os?: string
  recentDeviceName?: string
  recentDeviceSerial?: string
  recentDeviceMac?: string
  ssid?: string
  vlan?: number
  switchport?: string
  status: string
  usage: { sent: number; recv: number }
}

// ── Switch Ports ────────────────────────────────────────────

export interface MerakiSwitchPort {
  portId: string
  name?: string
  tags: string[]
  enabled: boolean
  type: 'access' | 'trunk'
  vlan?: number
  voiceVlan?: number
  allowedVlans?: string
  poeEnabled: boolean
  isolationEnabled: boolean
  rstpEnabled: boolean
  stpGuard?: string
  linkNegotiation: string
  portScheduleId?: string
}

export interface MerakiSwitchPortStatus {
  portId: string
  enabled: boolean
  status: 'Connected' | 'Disconnected' | 'Disabled'
  speed?: string
  duplex?: string
  usageInKb: { sent: number; recv: number }
  errors: string[]
  warnings: string[]
  clientCount: number
  trafficInKbps: { sent: number; recv: number }
  powerUsageInWh?: number
  lldp?: { systemName?: string; systemDescription?: string }
  cdp?: { deviceId?: string; platform?: string }
}

// ── Alerts ──────────────────────────────────────────────────

export interface MerakiAlert {
  alertType: string
  alertTypeId: string
  occurredAt: string
  alertData?: Record<string, unknown>
  device?: {
    serial: string
    name: string
    model: string
    url: string
    productType: string
  }
  network?: {
    id: string
    name: string
    url: string
  }
  organization?: {
    id: string
    name: string
    url: string
  }
  severity: 'informational' | 'warning' | 'critical'
  category: string
}

// ── Licensing ───────────────────────────────────────────────

export interface MerakiLicenseOverview {
  status: string
  expirationDate?: string
  licensedDeviceCounts: Record<string, number>
  licensedDeviceCountSummary?: { total: number }
  systemsManagerCount?: number
  states?: {
    active: { count: number }
    expired: { count: number }
    expiring: { count: number }
    unused: { count: number }
    unusedActive: { count: number }
    recentlyQueued: { count: number }
  }
}

export interface MerakiLicense {
  id: string
  licenseType: string
  licenseKey: string
  orderNumber?: string
  deviceSerial?: string
  networkId?: string
  state: 'active' | 'expired' | 'expiring' | 'unused' | 'unusedActive' | 'recentlyQueued'
  seatCount?: number
  totalDurationInDays?: number
  claimDate?: string
  activationDate?: string
  expirationDate?: string
}

// ── Firmware ────────────────────────────────────────────────

export interface MerakiFirmwareUpgrade {
  productType: string
  currentVersion: { id: string; firmware: string; shortName: string; releaseDate: string }
  lastUpgrade?: { time: string; fromVersion: { firmware: string }; toVersion: { firmware: string } }
  nextUpgradeTime?: string
  availableVersions: Array<{ id: string; firmware: string; shortName: string; releaseDate: string }>
  participateInNextBetaRelease?: boolean
}

// ── Webhooks ────────────────────────────────────────────────

export interface MerakiWebhookPayload {
  version: string
  sharedSecret: string
  sentAt: string
  organizationId: string
  organizationName: string
  organizationUrl: string
  networkId: string
  networkName: string
  networkUrl: string
  networkTags: string[]
  deviceSerial: string
  deviceMac: string
  deviceName: string
  deviceUrl: string
  deviceTags: string[]
  deviceModel: string
  alertId: string
  alertType: string
  alertTypeId: string
  alertLevel: string
  alertData: Record<string, unknown>
}

// ── Dashboard Aggregated Views ──────────────────────────────

export interface MerakiDashboardOverview {
  organizations: MerakiOrganization[]
  totalDevices: number
  onlineDevices: number
  alertingDevices: number
  offlineDevices: number
  totalNetworks: number
  totalClients: number
}

export interface MerakiNetworkSummary {
  network: MerakiNetwork
  deviceCount: number
  clientCount: number
  onlineDevices: number
  offlineDevices: number
  alertingDevices: number
}

export interface MerakiDeviceDetail {
  device: MerakiDevice
  status: MerakiDeviceStatus
  uplinks?: MerakiUplink[]
  switchPorts?: MerakiSwitchPortStatus[]
  ssids?: MerakiSSID[]
  clients?: MerakiClient[]
}

// ── API Response Wrappers ───────────────────────────────────

export interface MerakiApiResponse<T> {
  ok: boolean
  data: T
  demo?: boolean
}

export interface MerakiListResponse<T> {
  ok: boolean
  data: T[]
  demo?: boolean
}
