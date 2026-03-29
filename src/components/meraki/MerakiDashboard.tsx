'use client'

import { useState } from 'react'
import {
  Activity,
  Server,
  Network,
  AlertTriangle,
  Globe,
  Wifi,
  Key,
  Building2,
  ChevronDown,
  RefreshCw,
} from 'lucide-react'
import {
  useMerakiOverview,
  useMerakiOrganizations,
  useMerakiDevices,
  useMerakiNetworks,
  useMerakiAlerts,
  useMerakiUplinks,
  useMerakiLicensing,
  useMerakiSSIDs,
} from '@/hooks/useMerakiData'
import type {
  MerakiDeviceStatus,
  MerakiAlert,
  MerakiUplinkStatus,
  MerakiLicenseOverview,
  MerakiSSID,
  MerakiNetworkSummary,
  MerakiNetwork,
} from '@/types/meraki'

// ── Tab definitions ─────────────────────────────────────────

type MerakiTab = 'overview' | 'devices' | 'networks' | 'alerts' | 'wan' | 'wireless' | 'licensing'

const TABS: { id: MerakiTab; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'devices', label: 'Devices', icon: Server },
  { id: 'networks', label: 'Networks', icon: Network },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { id: 'wan', label: 'WAN', icon: Globe },
  { id: 'wireless', label: 'Wireless', icon: Wifi },
  { id: 'licensing', label: 'Licensing', icon: Key },
]

// ── Main Dashboard ──────────────────────────────────────────

export function MerakiDashboard() {
  const [activeTab, setActiveTab] = useState<MerakiTab>('overview')
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>()
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false)

  const { data: overviewRes } = useMerakiOverview()
  const { data: orgsRes } = useMerakiOrganizations()

  const isDemo = overviewRes?.demo
  const orgs = orgsRes?.data ?? []
  const selectedOrg = orgs.find(o => o.id === selectedOrgId) || orgs[0]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Network className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Meraki Dashboard</h1>
              <p className="text-xs text-gray-500">Network monitoring across all managed organizations</p>
            </div>
            {isDemo && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                DEMO
              </span>
            )}
          </div>

          {/* Org Selector */}
          <div className="relative">
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="max-w-[200px] truncate">{selectedOrg?.name || 'All Organizations'}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {orgDropdownOpen && (
              <div className="absolute right-0 mt-1 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-50 py-1">
                <button
                  onClick={() => { setSelectedOrgId(undefined); setOrgDropdownOpen(false) }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  All Organizations
                </button>
                {orgs.map(org => (
                  <button
                    key={org.id}
                    onClick={() => { setSelectedOrgId(org.id); setOrgDropdownOpen(false) }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      selectedOrgId === org.id ? 'text-blue-500 font-medium' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {org.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tab Bar */}
        <div className="mt-4 flex gap-1 overflow-x-auto pb-px -mb-px">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/5'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-6">
        {activeTab === 'overview' && <OverviewTab orgId={selectedOrgId} />}
        {activeTab === 'devices' && <DevicesTab orgId={selectedOrgId} />}
        {activeTab === 'networks' && <NetworksTab orgId={selectedOrgId} />}
        {activeTab === 'alerts' && <AlertsTab orgId={selectedOrgId} />}
        {activeTab === 'wan' && <WANTab orgId={selectedOrgId} />}
        {activeTab === 'wireless' && <WirelessTab />}
        {activeTab === 'licensing' && <LicensingTab orgId={selectedOrgId} />}
      </div>
    </div>
  )
}

// ── KPI Card ────────────────────────────────────────────────

function KPI({ label, value, sub, color = 'text-gray-900 dark:text-white' }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Overview Tab ────────────────────────────────────────────

function OverviewTab({ orgId }: { orgId?: string }) {
  const { data: overviewRes, isLoading } = useMerakiOverview()
  const { data: alertsRes } = useMerakiAlerts(orgId)

  const d = overviewRes?.data
  const alerts = alertsRes?.data ?? []
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPI label="Organizations" value={d?.organizations.length ?? 0} />
        <KPI label="Total Devices" value={d?.totalDevices ?? 0} />
        <KPI label="Online" value={d?.onlineDevices ?? 0} color="text-green-500" />
        <KPI label="Alerting" value={d?.alertingDevices ?? 0} color={d?.alertingDevices ? 'text-amber-500' : 'text-gray-900 dark:text-white'} />
        <KPI label="Offline" value={d?.offlineDevices ?? 0} color={d?.offlineDevices ? 'text-red-500' : 'text-gray-900 dark:text-white'} />
        <KPI label="Critical Alerts" value={criticalAlerts} color={criticalAlerts > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'} />
      </div>

      {/* Device Health Ring + Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Device Health</h3>
          <DeviceHealthBars
            online={d?.onlineDevices ?? 0}
            alerting={d?.alertingDevices ?? 0}
            offline={d?.offlineDevices ?? 0}
            total={d?.totalDevices ?? 1}
          />
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Recent Alerts</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.slice(0, 8).map((alert, i) => (
              <AlertRow key={i} alert={alert} />
            ))}
            {alerts.length === 0 && (
              <p className="text-sm text-gray-500 py-4 text-center">No recent alerts</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DeviceHealthBars({ online, alerting, offline, total }: {
  online: number; alerting: number; offline: number; total: number
}) {
  const pct = (n: number) => Math.round((n / total) * 100)
  return (
    <div className="space-y-3">
      <HealthBar label="Online" count={online} pct={pct(online)} color="bg-green-500" />
      <HealthBar label="Alerting" count={alerting} pct={pct(alerting)} color="bg-amber-500" />
      <HealthBar label="Offline" count={offline} pct={pct(offline)} color="bg-red-500" />
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-xs text-gray-500">
        <span>Total: {total} devices</span>
        <span>{pct(online)}% healthy</span>
      </div>
    </div>
  )
}

function HealthBar({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-gray-900 dark:text-white font-medium">{count} ({pct}%)</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Devices Tab ─────────────────────────────────────────────

function DevicesTab({ orgId }: { orgId?: string }) {
  const { data: devicesRes, isLoading } = useMerakiDevices(orgId)
  const [filter, setFilter] = useState<'all' | 'online' | 'alerting' | 'offline'>('all')
  const [search, setSearch] = useState('')

  if (isLoading) return <LoadingState />

  const devices = devicesRes?.data ?? []
  const filtered = devices
    .filter(d => filter === 'all' || d.status === filter)
    .filter(d => !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.model.toLowerCase().includes(search.toLowerCase()) || d.serial.toLowerCase().includes(search.toLowerCase()))

  const statusCounts = {
    all: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    alerting: devices.filter(d => d.status === 'alerting').length,
    offline: devices.filter(d => d.status === 'offline').length,
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'online', 'alerting', 'offline'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filter === f
                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({statusCounts[f]})
          </button>
        ))}
        <input
          type="text"
          placeholder="Search devices..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ml-auto px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 w-48"
        />
      </div>

      {/* Device table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Model</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Serial</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">LAN IP</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden xl:table-cell">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map(device => (
                <DeviceRow key={device.serial} device={device} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No devices match filter</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function DeviceRow({ device }: { device: MerakiDeviceStatus }) {
  const statusColors: Record<string, string> = {
    online: 'bg-green-500',
    alerting: 'bg-amber-500',
    offline: 'bg-red-500',
    dormant: 'bg-gray-400',
  }

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="px-4 py-3">
        <span className={`inline-block w-2 h-2 rounded-full ${statusColors[device.status] || 'bg-gray-400'}`} />
      </td>
      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{device.name || device.serial}</td>
      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden sm:table-cell">{device.model}</td>
      <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden md:table-cell">{device.serial}</td>
      <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden lg:table-cell">{device.lanIp || '—'}</td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
          {device.productType}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs hidden xl:table-cell">
        {device.lastReportedAt ? new Date(device.lastReportedAt).toLocaleString() : '—'}
      </td>
    </tr>
  )
}

// ── Networks Tab ────────────────────────────────────────────

function NetworksTab({ orgId }: { orgId?: string }) {
  const { data: networksRes, isLoading } = useMerakiNetworks(orgId)

  if (isLoading) return <LoadingState />

  const items = networksRes?.data ?? []

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item, i) => {
        // Handle both MerakiNetworkSummary and MerakiNetwork
        const net = 'network' in item ? (item as MerakiNetworkSummary).network : (item as MerakiNetwork)
        const summary = 'network' in item ? (item as MerakiNetworkSummary) : null

        return (
          <div key={net.id || i} className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">{net.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{net.productTypes?.join(', ')}</p>
              </div>
              <Network className="w-4 h-4 text-gray-400" />
            </div>

            {summary && (
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{summary.deviceCount}</p>
                  <p className="text-[10px] text-gray-500">Devices</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-500">{summary.onlineDevices}</p>
                  <p className="text-[10px] text-gray-500">Online</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{summary.clientCount}</p>
                  <p className="text-[10px] text-gray-500">Clients</p>
                </div>
              </div>
            )}

            {net.tags && net.tags.length > 0 && (
              <div className="flex gap-1 mt-3 flex-wrap">
                {net.tags.map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 text-[10px] rounded bg-blue-500/10 text-blue-500">{tag}</span>
                ))}
              </div>
            )}
          </div>
        )
      })}
      {items.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500">No networks found</div>
      )}
    </div>
  )
}

// ── Alerts Tab ──────────────────────────────────────────────

function AlertsTab({ orgId }: { orgId?: string }) {
  const { data: alertsRes, isLoading } = useMerakiAlerts(orgId)
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'informational'>('all')

  if (isLoading) return <LoadingState />

  const alerts = (alertsRes?.data ?? []).filter(a => severityFilter === 'all' || a.severity === severityFilter)

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['all', 'critical', 'warning', 'informational'] as const).map(f => (
          <button
            key={f}
            onClick={() => setSeverityFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              severityFilter === f
                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-transparent'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
        {alerts.map((alert, i) => (
          <AlertRow key={i} alert={alert} expanded />
        ))}
        {alerts.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500">No alerts match filter</div>
        )}
      </div>
    </div>
  )
}

function AlertRow({ alert, expanded }: { alert: MerakiAlert; expanded?: boolean }) {
  const severityColors: Record<string, string> = {
    critical: 'text-red-500 bg-red-500/10',
    warning: 'text-amber-500 bg-amber-500/10',
    informational: 'text-blue-400 bg-blue-500/10',
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return `${Math.floor(diff / 60000)}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className={`${expanded ? 'px-4 py-3' : 'flex items-center gap-2 text-xs'}`}>
      <div className="flex items-center gap-2">
        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${severityColors[alert.severity] || 'text-gray-400 bg-gray-500/10'}`}>
          {alert.severity}
        </span>
        <span className="text-xs font-medium text-gray-900 dark:text-white">{alert.alertType}</span>
        <span className="text-[10px] text-gray-500 ml-auto">{timeAgo(alert.occurredAt)}</span>
      </div>
      {expanded && alert.network && (
        <p className="text-xs text-gray-500 mt-1">{alert.network.name}</p>
      )}
    </div>
  )
}

// ── WAN Tab ─────────────────────────────────────────────────

function WANTab({ orgId }: { orgId?: string }) {
  const { data: uplinksRes, isLoading } = useMerakiUplinks(orgId)

  if (isLoading) return <LoadingState />

  const uplinks = uplinksRes?.data ?? []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Appliances" value={uplinks.length} />
        <KPI label="Active Uplinks" value={uplinks.reduce((acc, u) => acc + u.uplinks.filter(ul => ul.status === 'active').length, 0)} color="text-green-500" />
        <KPI label="Failed Uplinks" value={uplinks.reduce((acc, u) => acc + u.uplinks.filter(ul => ul.status === 'failed').length, 0)} color="text-red-500" />
        <KPI label="Dual WAN" value={uplinks.filter(u => u.uplinks.length >= 2).length} />
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Device</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Model</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">WAN 1</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">WAN 2</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Provider</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {uplinks.map(u => (
                <UplinkRow key={u.serial} uplink={u} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function UplinkRow({ uplink }: { uplink: MerakiUplinkStatus }) {
  const wan1 = uplink.uplinks.find(u => u.interface === 'wan1')
  const wan2 = uplink.uplinks.find(u => u.interface === 'wan2')

  const statusBadge = (status?: string) => {
    const colors: Record<string, string> = {
      active: 'text-green-500 bg-green-500/10',
      ready: 'text-blue-400 bg-blue-500/10',
      'not connected': 'text-gray-400 bg-gray-500/10',
      failed: 'text-red-500 bg-red-500/10',
      connecting: 'text-amber-500 bg-amber-500/10',
    }
    return (
      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${colors[status || ''] || 'text-gray-400 bg-gray-500/10'}`}>
        {status || 'N/A'}
      </span>
    )
  }

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white text-xs">{uplink.serial}</td>
      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{uplink.model}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {statusBadge(wan1?.status)}
          <span className="text-[10px] text-gray-500 font-mono">{wan1?.publicIp || wan1?.ip || '—'}</span>
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        {wan2 ? (
          <div className="flex items-center gap-2">
            {statusBadge(wan2.status)}
            <span className="text-[10px] text-gray-500 font-mono">{wan2.publicIp || wan2.ip || '—'}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{wan1?.provider || '—'}</td>
    </tr>
  )
}

// ── Wireless Tab ────────────────────────────────────────────

function WirelessTab() {
  const { data: ssidsRes, isLoading } = useMerakiSSIDs()

  if (isLoading) return <LoadingState />

  const ssids = ssidsRes?.data ?? []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KPI label="SSIDs Configured" value={ssids.length} />
        <KPI label="Enabled" value={ssids.filter(s => s.enabled).length} color="text-green-500" />
        <KPI label="Disabled" value={ssids.filter(s => !s.enabled).length} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ssids.map(ssid => (
          <SSIDCard key={ssid.number} ssid={ssid} />
        ))}
      </div>
    </div>
  )
}

function SSIDCard({ ssid }: { ssid: MerakiSSID }) {
  return (
    <div className={`rounded-xl border bg-white dark:bg-gray-900 p-4 ${
      ssid.enabled
        ? 'border-gray-200 dark:border-gray-700/50'
        : 'border-gray-100 dark:border-gray-800 opacity-60'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Wifi className={`w-4 h-4 ${ssid.enabled ? 'text-green-500' : 'text-gray-400'}`} />
          <h3 className="font-medium text-sm text-gray-900 dark:text-white">{ssid.name}</h3>
        </div>
        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
          ssid.enabled ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
        }`}>
          {ssid.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
      <div className="space-y-1 text-xs text-gray-500">
        <p>Auth: {ssid.authMode}</p>
        {ssid.encryptionMode && <p>Encryption: {ssid.encryptionMode}</p>}
        {ssid.splashPage && <p>Splash: {ssid.splashPage}</p>}
        <p>Visible: {ssid.visible ? 'Yes' : 'Hidden'}</p>
      </div>
    </div>
  )
}

// ── Licensing Tab ───────────────────────────────────────────

function LicensingTab({ orgId }: { orgId?: string }) {
  const { data: licensingRes, isLoading } = useMerakiLicensing(orgId)

  if (isLoading) return <LoadingState />

  const lic = licensingRes?.data as MerakiLicenseOverview | undefined

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Status" value={lic?.status || 'Unknown'} color={lic?.status === 'OK' ? 'text-green-500' : 'text-amber-500'} />
        <KPI label="Active Licenses" value={lic?.states?.active.count ?? 0} color="text-green-500" />
        <KPI label="Expiring" value={lic?.states?.expiring.count ?? 0} color={(lic?.states?.expiring.count ?? 0) > 0 ? 'text-amber-500' : 'text-gray-900 dark:text-white'} />
        <KPI label="Expired" value={lic?.states?.expired.count ?? 0} color={(lic?.states?.expired.count ?? 0) > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'} />
      </div>

      {lic?.expirationDate && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs text-gray-500">Co-Termination Expiration Date</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
            {new Date(lic.expirationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      )}

      {lic?.licensedDeviceCounts && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Licensed Devices by Type</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(lic.licensedDeviceCounts).map(([type, count]) => (
              <div key={type} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{count}</p>
                <p className="text-xs text-gray-500 mt-0.5">{type}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Loading State ───────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
    </div>
  )
}
