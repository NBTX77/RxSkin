// ============================================================
// Meraki Mock Data — Realistic demo data for development
// Used when credentials aren't configured or demo mode is on.
// ============================================================

import type {
  MerakiOrganization,
  MerakiNetwork,
  MerakiDeviceStatus,
  MerakiDevice,
  MerakiUplinkStatus,
  MerakiAlert,
  MerakiLicenseOverview,
  MerakiClient,
  MerakiSSID,
  MerakiSwitchPortStatus,
  MerakiDashboardOverview,
  MerakiNetworkSummary,
  MerakiFirmwareUpgrade,
} from '@/types/meraki'

// ── Seeded Random ───────────────────────────────────────────

let seed = 77
function seededRandom(): number {
  seed = (seed * 16807 + 0) % 2147483647
  return (seed - 1) / 2147483646
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)]
}
function resetSeed() { seed = 77 }

// ── Organizations ───────────────────────────────────────────

const ORG_NAMES = [
  'Rx Technology', 'Meridian Healthcare', 'Apex Financial Group',
  'Summit Legal Partners', 'Cascade Manufacturing', 'Lighthouse Education',
  'Pinnacle Engineering', 'Redwood Properties', 'Sterling Insurance',
]

export function getMockOrganizations(): MerakiOrganization[] {
  resetSeed()
  return ORG_NAMES.map((name, i) => ({
    id: `718324140565${595403 + i}`,
    name,
    url: `https://dashboard.meraki.com/o/${name.toLowerCase().replace(/\s/g, '-')}/manage`,
    api: { enabled: true },
    licensing: { model: i === 0 ? 'co-term' : pick(['co-term', 'per-device']) },
    cloud: { region: { name: 'North America' } },
  }))
}

// ── Networks ────────────────────────────────────────────────

const NETWORK_TEMPLATES: Array<{ suffix: string; products: string[] }> = [
  { suffix: 'Main Office', products: ['appliance', 'switch', 'wireless'] },
  { suffix: 'Branch Office', products: ['appliance', 'switch', 'wireless'] },
  { suffix: 'Warehouse', products: ['appliance', 'switch'] },
  { suffix: 'Remote Site', products: ['appliance', 'wireless'] },
]

export function getMockNetworks(orgId?: string): MerakiNetwork[] {
  resetSeed()
  const orgs = getMockOrganizations()
  const networks: MerakiNetwork[] = []

  for (const org of orgs) {
    if (orgId && org.id !== orgId) continue
    const count = org.name === 'Rx Technology' ? 4 : Math.floor(seededRandom() * 3) + 1
    for (let i = 0; i < count; i++) {
      const tmpl = NETWORK_TEMPLATES[i % NETWORK_TEMPLATES.length]
      networks.push({
        id: `N_${org.id.slice(-6)}${String(i).padStart(3, '0')}`,
        organizationId: org.id,
        name: `${org.name} - ${tmpl.suffix}`,
        productTypes: tmpl.products,
        timeZone: 'America/Chicago',
        tags: i === 0 ? ['primary'] : [],
        url: `https://dashboard.meraki.com/network/${org.id}/manage`,
        isBoundToConfigTemplate: false,
      })
    }
  }

  return networks
}

// ── Devices ─────────────────────────────────────────────────

const DEVICE_MODELS: Record<string, string[]> = {
  appliance: ['MX68', 'MX68W', 'MX84', 'MX100', 'MX250', 'Z4'],
  switch: ['MS120-8', 'MS120-24', 'MS225-24P', 'MS225-48FP', 'MS350-24X'],
  wireless: ['MR36', 'MR44', 'MR46', 'MR56', 'CW9162'],
}

const FIRMWARE_VERSIONS = [
  'MX 18.211.2', 'MX 18.107', 'MS 15.21.1', 'MS 14.33',
  'MR 30.7.1', 'MR 29.7', 'wireless-29-7',
]

export function getMockDeviceStatuses(orgId?: string): MerakiDeviceStatus[] {
  resetSeed()
  const networks = getMockNetworks(orgId)
  const devices: MerakiDeviceStatus[] = []

  for (const net of networks) {
    for (const productType of net.productTypes) {
      const count = productType === 'switch' ? Math.floor(seededRandom() * 3) + 1
        : productType === 'wireless' ? Math.floor(seededRandom() * 4) + 1 : 1
      for (let d = 0; d < count; d++) {
        const model = pick(DEVICE_MODELS[productType] || ['Unknown'])
        const statusRoll = seededRandom()
        const status = statusRoll < 0.78 ? 'online'
          : statusRoll < 0.88 ? 'alerting'
          : statusRoll < 0.96 ? 'offline' : 'dormant'

        devices.push({
          serial: `Q2XX-${net.id.slice(-4)}-${String(d).padStart(2, '0')}${String(Math.floor(seededRandom() * 99)).padStart(2, '0')}`,
          name: `${net.name.split(' - ')[1] || 'Site'}-${model}-${d + 1}`,
          mac: Array.from({ length: 6 }, () => Math.floor(seededRandom() * 256).toString(16).padStart(2, '0')).join(':'),
          model,
          networkId: net.id,
          status: status as MerakiDeviceStatus['status'],
          lanIp: `10.${Math.floor(seededRandom() * 255)}.${Math.floor(seededRandom() * 255)}.${Math.floor(seededRandom() * 254) + 1}`,
          publicIp: status === 'online' ? `${pick(['72', '98', '104', '216'])}.${Math.floor(seededRandom() * 255)}.${Math.floor(seededRandom() * 255)}.${Math.floor(seededRandom() * 254) + 1}` : undefined,
          productType,
          lastReportedAt: new Date(Date.now() - Math.floor(seededRandom() * 3600000)).toISOString(),
        })
      }
    }
  }

  return devices
}

export function getMockDevices(networkId?: string): MerakiDevice[] {
  resetSeed()
  const statuses = getMockDeviceStatuses()
  const filtered = networkId ? statuses.filter(d => d.networkId === networkId) : statuses

  return filtered.map(s => ({
    serial: s.serial,
    name: s.name,
    mac: s.mac,
    model: s.model,
    networkId: s.networkId,
    tags: [],
    lat: 32.7767 + (seededRandom() - 0.5) * 0.1,
    lng: -96.797 + (seededRandom() - 0.5) * 0.1,
    firmware: pick(FIRMWARE_VERSIONS),
    url: `https://dashboard.meraki.com/device/${s.serial}`,
    lanIp: s.lanIp,
    wan1Ip: s.publicIp,
  }))
}

// ── Uplinks ─────────────────────────────────────────────────

export function getMockUplinkStatuses(orgId?: string): MerakiUplinkStatus[] {
  resetSeed()
  const devices = getMockDeviceStatuses(orgId).filter(d => d.productType === 'appliance')

  return devices.map(d => ({
    serial: d.serial,
    model: d.model,
    networkId: d.networkId,
    lastReportedAt: d.lastReportedAt,
    uplinks: [
      {
        interface: 'wan1',
        status: d.status === 'online' ? 'active' : 'not connected',
        ip: d.lanIp,
        publicIp: d.publicIp,
        gateway: d.lanIp?.replace(/\.\d+$/, '.1'),
        provider: pick(['Spectrum', 'AT&T', 'Comcast', 'CenturyLink', 'Frontier']),
        connectionType: pick(['Ethernet', 'Fiber', 'Cable']),
      },
      ...(seededRandom() > 0.5 ? [{
        interface: 'wan2' as const,
        status: pick(['active', 'ready', 'not connected']) as MerakiUplinkStatus['uplinks'][number]['status'],
        ip: `10.${Math.floor(seededRandom() * 255)}.0.1`,
        provider: pick(['T-Mobile 5G', 'Verizon LTE', 'AT&T LTE']),
        connectionType: 'Cellular' as const,
      }] : []),
    ],
  }))
}

// ── Alerts ──────────────────────────────────────────────────

const ALERT_TYPES = [
  { type: 'Device went offline', severity: 'critical' as const, category: 'device' },
  { type: 'Device came online', severity: 'informational' as const, category: 'device' },
  { type: 'WAN uplink status changed', severity: 'warning' as const, category: 'uplink' },
  { type: 'Rogue AP detected', severity: 'warning' as const, category: 'wireless' },
  { type: 'VPN connectivity changed', severity: 'warning' as const, category: 'vpn' },
  { type: 'High CPU usage', severity: 'warning' as const, category: 'performance' },
  { type: 'License expiring soon', severity: 'warning' as const, category: 'licensing' },
  { type: 'New DHCP server detected', severity: 'informational' as const, category: 'network' },
  { type: 'Port link down', severity: 'informational' as const, category: 'switch' },
  { type: 'Firmware upgrade available', severity: 'informational' as const, category: 'firmware' },
]

export function getMockAlerts(orgId?: string): MerakiAlert[] {
  resetSeed()
  const networks = getMockNetworks(orgId)
  const alerts: MerakiAlert[] = []

  for (let i = 0; i < 25; i++) {
    const net = pick(networks)
    const tmpl = pick(ALERT_TYPES)
    const hoursAgo = Math.floor(seededRandom() * 168) // up to 1 week
    alerts.push({
      alertType: tmpl.type,
      alertTypeId: `alert_${tmpl.type.toLowerCase().replace(/\s/g, '_')}`,
      occurredAt: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
      severity: tmpl.severity,
      category: tmpl.category,
      network: { id: net.id, name: net.name, url: net.url },
      organization: { id: net.organizationId, name: ORG_NAMES[0], url: '' },
    })
  }

  return alerts.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
}

// ── Licensing ───────────────────────────────────────────────

export function getMockLicenseOverview(): MerakiLicenseOverview {
  return {
    status: 'OK',
    expirationDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    licensedDeviceCounts: {
      MS: 42,
      MR: 67,
      MX: 18,
      Z: 5,
    },
    states: {
      active: { count: 132 },
      expired: { count: 3 },
      expiring: { count: 2 },
      unused: { count: 8 },
      unusedActive: { count: 5 },
      recentlyQueued: { count: 0 },
    },
  }
}

// ── Clients ─────────────────────────────────────────────────

export function getMockClients(networkId?: string): MerakiClient[] {
  resetSeed()
  const OS_LIST = ['Windows 10', 'Windows 11', 'macOS', 'iOS', 'Android', 'Linux', 'ChromeOS']
  const MANUFACTURERS = ['Dell', 'Apple', 'HP', 'Lenovo', 'Samsung', 'Intel', 'Google']

  const count = networkId ? Math.floor(seededRandom() * 30) + 10 : 103
  return Array.from({ length: count }, (_, i) => ({
    id: `k${String(i).padStart(6, '0')}`,
    mac: Array.from({ length: 6 }, () => Math.floor(seededRandom() * 256).toString(16).padStart(2, '0')).join(':'),
    description: seededRandom() > 0.5 ? `Device-${i + 1}` : undefined,
    ip: `10.${Math.floor(seededRandom() * 255)}.${Math.floor(seededRandom() * 255)}.${Math.floor(seededRandom() * 254) + 1}`,
    firstSeen: new Date(Date.now() - Math.floor(seededRandom() * 30 * 86400000)).toISOString(),
    lastSeen: new Date(Date.now() - Math.floor(seededRandom() * 3600000)).toISOString(),
    manufacturer: pick(MANUFACTURERS),
    os: pick(OS_LIST),
    status: seededRandom() > 0.3 ? 'Online' : 'Offline',
    usage: {
      sent: Math.floor(seededRandom() * 500000000),
      recv: Math.floor(seededRandom() * 2000000000),
    },
    ssid: seededRandom() > 0.4 ? pick(['Corporate-WiFi', 'Guest-WiFi', 'IoT-Network']) : undefined,
    vlan: pick([1, 10, 20, 100, 200]),
  }))
}

// ── SSIDs ───────────────────────────────────────────────────

export function getMockSSIDs(): MerakiSSID[] {
  return [
    { number: 0, name: 'Corporate-WiFi', enabled: true, authMode: 'wpa2-enterprise', encryptionMode: 'wpa', visible: true },
    { number: 1, name: 'Guest-WiFi', enabled: true, authMode: 'open', splashPage: 'Click-through splash page', visible: true },
    { number: 2, name: 'IoT-Network', enabled: true, authMode: 'wpa2-personal', encryptionMode: 'wpa', visible: false },
    { number: 3, name: 'Unconfigured SSID 4', enabled: false, authMode: 'open', visible: false },
  ]
}

// ── Switch Ports ────────────────────────────────────────────

export function getMockSwitchPortStatuses(serial?: string): MerakiSwitchPortStatus[] {
  resetSeed()
  const portCount = serial?.includes('48') ? 48 : serial?.includes('24') ? 24 : 8

  return Array.from({ length: portCount }, (_, i) => ({
    portId: String(i + 1),
    enabled: true,
    status: seededRandom() > 0.3 ? 'Connected' : 'Disconnected',
    speed: seededRandom() > 0.5 ? '1 Gbps' : '100 Mbps',
    duplex: 'full',
    usageInKb: { sent: Math.floor(seededRandom() * 100000), recv: Math.floor(seededRandom() * 500000) },
    errors: [],
    warnings: [],
    clientCount: Math.floor(seededRandom() * 5),
    trafficInKbps: { sent: Math.floor(seededRandom() * 10000), recv: Math.floor(seededRandom() * 50000) },
    powerUsageInWh: seededRandom() > 0.5 ? Math.floor(seededRandom() * 30) : undefined,
  })) as MerakiSwitchPortStatus[]
}

// ── Firmware ────────────────────────────────────────────────

export function getMockFirmwareUpgrades(): MerakiFirmwareUpgrade[] {
  return [
    {
      productType: 'appliance',
      currentVersion: { id: 'fw1', firmware: 'MX 18.211.2', shortName: 'MX 18.211.2', releaseDate: '2026-02-15' },
      availableVersions: [
        { id: 'fw1a', firmware: 'MX 18.211.2', shortName: 'MX 18.211.2', releaseDate: '2026-02-15' },
        { id: 'fw1b', firmware: 'MX 19.1', shortName: 'MX 19.1 (beta)', releaseDate: '2026-03-20' },
      ],
    },
    {
      productType: 'switch',
      currentVersion: { id: 'fw2', firmware: 'MS 15.21.1', shortName: 'MS 15.21.1', releaseDate: '2026-01-10' },
      availableVersions: [
        { id: 'fw2a', firmware: 'MS 15.21.1', shortName: 'MS 15.21.1', releaseDate: '2026-01-10' },
        { id: 'fw2b', firmware: 'MS 16.1', shortName: 'MS 16.1', releaseDate: '2026-03-01' },
      ],
    },
    {
      productType: 'wireless',
      currentVersion: { id: 'fw3', firmware: 'MR 30.7.1', shortName: 'MR 30.7.1', releaseDate: '2026-03-05' },
      availableVersions: [
        { id: 'fw3a', firmware: 'MR 30.7.1', shortName: 'MR 30.7.1', releaseDate: '2026-03-05' },
      ],
    },
  ]
}

// ── Dashboard Overview (Aggregated) ─────────────────────────

export function getMockDashboardOverview(): MerakiDashboardOverview {
  const orgs = getMockOrganizations()
  const devices = getMockDeviceStatuses()
  const networks = getMockNetworks()
  const clients = getMockClients()

  return {
    organizations: orgs,
    totalDevices: devices.length,
    onlineDevices: devices.filter(d => d.status === 'online').length,
    alertingDevices: devices.filter(d => d.status === 'alerting').length,
    offlineDevices: devices.filter(d => d.status === 'offline').length,
    totalNetworks: networks.length,
    totalClients: clients.length,
  }
}

// ── Network Summary ─────────────────────────────────────────

export function getMockNetworkSummaries(orgId?: string): MerakiNetworkSummary[] {
  const networks = getMockNetworks(orgId)
  const allDevices = getMockDeviceStatuses(orgId)

  return networks.map(network => {
    const netDevices = allDevices.filter(d => d.networkId === network.id)
    return {
      network,
      deviceCount: netDevices.length,
      clientCount: Math.floor(seededRandom() * 40) + 5,
      onlineDevices: netDevices.filter(d => d.status === 'online').length,
      offlineDevices: netDevices.filter(d => d.status === 'offline').length,
      alertingDevices: netDevices.filter(d => d.status === 'alerting').length,
    }
  })
}
