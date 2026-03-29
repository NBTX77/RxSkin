'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  HardDrive,
  AlertTriangle,
  AlertOctagon,
  Cloud,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Server,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Mail,
  Database,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react'
import { KPICard } from '@/components/ui/KPICard'
import type {
  DattoDashboardSummary,
  DattoDevice,
  DattoAlert,
  DattoSaaSCustomer,
  DattoSaaSApplication,
  DattoActivityLog,
  DattoPaginatedResponse,
} from '@/types/datto'

// ── Data Hooks ──────────────────────────────────────────────

function useDattoSummary() {
  return useQuery<DattoDashboardSummary>({
    queryKey: ['datto', 'summary'],
    queryFn: async () => {
      const res = await fetch('/api/datto?endpoint=summary')
      if (!res.ok) throw new Error('Failed to fetch Datto summary')
      return res.json()
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

function useDattoDevices() {
  return useQuery<DattoPaginatedResponse<DattoDevice>>({
    queryKey: ['datto', 'devices'],
    queryFn: async () => {
      const res = await fetch('/api/datto?endpoint=devices')
      if (!res.ok) throw new Error('Failed to fetch devices')
      return res.json()
    },
    staleTime: 30_000,
  })
}

function useDattoAlerts() {
  return useQuery<DattoPaginatedResponse<DattoAlert>>({
    queryKey: ['datto', 'alerts'],
    queryFn: async () => {
      const res = await fetch('/api/datto?endpoint=alerts')
      if (!res.ok) throw new Error('Failed to fetch alerts')
      return res.json()
    },
    staleTime: 30_000,
  })
}

function useDattoSaaSCustomers() {
  return useQuery<DattoPaginatedResponse<DattoSaaSCustomer>>({
    queryKey: ['datto', 'saas'],
    queryFn: async () => {
      const res = await fetch('/api/datto?endpoint=saas')
      if (!res.ok) throw new Error('Failed to fetch SaaS data')
      return res.json()
    },
    staleTime: 60_000,
  })
}

function useDattoSaaSApps() {
  return useQuery<{ items: DattoSaaSApplication[] }>({
    queryKey: ['datto', 'saas-apps'],
    queryFn: async () => {
      const res = await fetch('/api/datto?endpoint=saas-apps')
      if (!res.ok) throw new Error('Failed to fetch SaaS apps')
      return res.json()
    },
    staleTime: 60_000,
  })
}

function useDattoActivity() {
  return useQuery<DattoPaginatedResponse<DattoActivityLog>>({
    queryKey: ['datto', 'activity'],
    queryFn: async () => {
      const res = await fetch('/api/datto?endpoint=activity')
      if (!res.ok) throw new Error('Failed to fetch activity')
      return res.json()
    },
    staleTime: 30_000,
  })
}

function useDattoConfig() {
  return useQuery<{ enabled: boolean; dataMode: string; isConfigured: boolean }>({
    queryKey: ['datto', 'config'],
    queryFn: async () => {
      const res = await fetch('/api/datto?endpoint=config')
      if (!res.ok) throw new Error('Failed to fetch config')
      return res.json()
    },
    staleTime: 60_000,
  })
}

// ── Main Page ───────────────────────────────────────────────

export default function DattoPage() {
  const [activeTab, setActiveTab] = useState<'bcdr' | 'saas' | 'activity'>('bcdr')
  const queryClient = useQueryClient()

  const { data: config } = useDattoConfig()
  const { data: summary, isLoading: summaryLoading } = useDattoSummary()
  const { data: devicesData } = useDattoDevices()
  const { data: alertsData } = useDattoAlerts()
  const { data: saasData } = useDattoSaaSCustomers()
  const { data: saasAppsData } = useDattoSaaSApps()
  const { data: activityData } = useDattoActivity()

  const toggleMode = useMutation({
    mutationFn: async (newMode: 'live' | 'demo') => {
      const res = await fetch('/api/datto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'config', dataMode: newMode }),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datto'] })
    },
  })

  const devices = devicesData?.items || []
  const alerts = alertsData?.items || []
  const saasCustomers = saasData?.items || []
  const saasApps = saasAppsData?.items || []
  const activity = activityData?.items || []

  const isDemo = config?.dataMode === 'demo'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Datto Backup & SaaS Protection</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            BCDR appliances, agents, alerts, and SaaS backup status
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Demo/Live toggle */}
          <button
            onClick={() => toggleMode.mutate(isDemo ? 'live' : 'demo')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isDemo
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
            }`}
          >
            {isDemo ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
            {isDemo ? 'Demo Data' : 'Live Data'}
          </button>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['datto'] })}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Demo mode banner */}
      {isDemo && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 text-xs">
          <Info size={14} />
          Showing demo data. Connect your Datto API credentials in Admin → Integrations to see live data.
        </div>
      )}

      {/* KPI Strip */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg px-3 py-2.5 animate-pulse h-16" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <KPICard icon={HardDrive} color="bg-blue-500" label="BCDR Devices" value={summary.bcdr.totalDevices} subtitle={`${summary.bcdr.onlineDevices} online`} />
          <KPICard icon={Server} color="bg-purple-500" label="Protected Agents" value={summary.bcdr.totalAgents} />
          <KPICard icon={AlertTriangle} color={summary.bcdr.criticalAlerts > 0 ? 'bg-red-500' : 'bg-green-500'} label="Active Alerts" value={summary.bcdr.activeAlerts} subtitle={summary.bcdr.criticalAlerts > 0 ? `${summary.bcdr.criticalAlerts} critical` : 'All clear'} />
          <KPICard icon={CheckCircle2} color="bg-emerald-500" label="Backup Success" value={`${summary.bcdr.lastBackupSuccessRate}%`} />
          <KPICard icon={Cloud} color="bg-cyan-500" label="SaaS Customers" value={summary.saas.totalCustomers} subtitle={`${summary.saas.protectedSeats}/${summary.saas.totalSeats} seats`} />
          <KPICard icon={Activity} color="bg-orange-500" label="VM Restores" value={summary.bcdr.activeVMRestores} subtitle={summary.bcdr.activeVMRestores > 0 ? 'In progress' : 'None active'} />
        </div>
      ) : null}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800">
        {[
          { key: 'bcdr' as const, label: 'BCDR Devices & Alerts', icon: HardDrive },
          { key: 'saas' as const, label: 'SaaS Protection', icon: Cloud },
          { key: 'activity' as const, label: 'Activity Log', icon: Clock },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'bcdr' && (
        <BCDRTab devices={devices} alerts={alerts} />
      )}
      {activeTab === 'saas' && (
        <SaaSTab customers={saasCustomers} apps={saasApps} />
      )}
      {activeTab === 'activity' && (
        <ActivityTab activity={activity} />
      )}
    </div>
  )
}

// ── BCDR Tab ────────────────────────────────────────────────

function BCDRTab({ devices, alerts }: { devices: DattoDevice[]; alerts: DattoAlert[] }) {
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null)
  const unresolvedAlerts = alerts.filter(a => !a.isResolved)
  const criticalAlerts = unresolvedAlerts.filter(a => a.severity === 'critical')
  const warningAlerts = unresolvedAlerts.filter(a => a.severity === 'warning')

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      {unresolvedAlerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertOctagon size={14} className="text-red-400" />
            Active Alerts ({unresolvedAlerts.length})
          </h3>
          <div className="space-y-1.5">
            {criticalAlerts.map((alert, i) => (
              <AlertRow key={`crit-${i}`} alert={alert} />
            ))}
            {warningAlerts.map((alert, i) => (
              <AlertRow key={`warn-${i}`} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Device List */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <HardDrive size={14} />
          BCDR Devices ({devices.length})
        </h3>
        <div className="space-y-1.5">
          {devices.map(device => (
            <DeviceRow
              key={device.serialNumber}
              device={device}
              alerts={alerts.filter(a => a.deviceSerialNumber === device.serialNumber && !a.isResolved)}
              expanded={expandedDevice === device.serialNumber}
              onToggle={() => setExpandedDevice(expandedDevice === device.serialNumber ? null : device.serialNumber)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Device Row ──────────────────────────────────────────────

function DeviceRow({
  device,
  alerts,
  expanded,
  onToggle,
}: {
  device: DattoDevice
  alerts: DattoAlert[]
  expanded: boolean
  onToggle: () => void
}) {
  const lastSeen = new Date(device.lastSeenDate)
  const isOnline = Date.now() - lastSeen.getTime() < 3600_000 * 2
  const uptimeDays = Math.floor(device.uptime / 86400)

  const storageDisplay = device.localStorageUsed.units === 'TB'
    ? `${device.localStorageUsed.size} TB`
    : `${Math.round(device.localStorageUsed.size / 1024 * 100) / 100} TB`

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{device.name}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 flex-shrink-0">
                {device.model}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate">
              {device.clientCompanyName} · {device.agentCount} agents · {storageDisplay} used
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {alerts.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-400">
              <AlertTriangle size={12} />
              {alerts.length}
            </span>
          )}
          <span className={`text-xs ${isOnline ? 'text-green-500' : 'text-red-400'}`}>
            {isOnline ? 'Online' : `Offline ${formatTimeAgo(lastSeen)}`}
          </span>
          {expanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <DetailItem label="Serial" value={device.serialNumber} />
            <DetailItem label="Internal IP" value={device.internalIP} />
            <DetailItem label="Uptime" value={uptimeDays > 0 ? `${uptimeDays} days` : 'Offline'} />
            <DetailItem label="Last Seen" value={formatDate(lastSeen)} />
            <DetailItem label="Local Storage" value={`${device.localStorageUsed.size} ${device.localStorageUsed.units} / ${device.localStorageAvailable.size} ${device.localStorageAvailable.units}`} />
            <DetailItem label="Offsite Storage" value={`${device.offsiteStorageUsed.size} ${device.offsiteStorageUsed.units}`} />
            <DetailItem label="Agents" value={String(device.agentCount)} />
            <DetailItem label="Registered" value={formatDate(new Date(device.registrationDate))} />
          </div>

          {alerts.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Device Alerts</p>
              {alerts.map((alert, i) => (
                <AlertRow key={i} alert={alert} compact />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Alert Row ───────────────────────────────────────────────

function AlertRow({ alert, compact }: { alert: DattoAlert; compact?: boolean }) {
  const severityStyles = {
    critical: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400',
    warning: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400',
    info: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400',
  }
  const severityIcons = {
    critical: AlertOctagon,
    warning: AlertTriangle,
    info: Info,
  }
  const Icon = severityIcons[alert.severity]

  return (
    <div className={`flex items-start gap-2.5 px-3 py-2 rounded-lg border ${severityStyles[alert.severity]} ${compact ? 'text-xs' : 'text-sm'}`}>
      <Icon size={compact ? 12 : 14} className="flex-shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
          {!compact && <span className="opacity-75">{alert.deviceName} · </span>}
          {alert.alertType.replace(/_/g, ' ')}
        </p>
        <p className={`opacity-75 ${compact ? 'text-[10px]' : 'text-xs'}`}>{alert.message}</p>
        {!compact && (
          <p className="text-[10px] opacity-50 mt-0.5">{alert.clientCompanyName} · {formatTimeAgo(new Date(alert.timestamp))}</p>
        )}
      </div>
    </div>
  )
}

// ── SaaS Tab ────────────────────────────────────────────────

function SaaSTab({ customers, apps }: { customers: DattoSaaSCustomer[]; apps: DattoSaaSApplication[] }) {
  const m365 = customers.filter(c => c.saasType === 'microsoft365')
  const google = customers.filter(c => c.saasType === 'google_workspace')

  return (
    <div className="space-y-6">
      {/* M365 Customers */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Mail size={14} className="text-blue-400" />
          Microsoft 365 Backup ({m365.length} customers)
        </h3>
        <div className="space-y-1.5">
          {m365.map(customer => (
            <SaaSCustomerRow key={customer.id} customer={customer} apps={apps.filter(a => a.domain === customer.domain)} />
          ))}
        </div>
      </div>

      {/* Google Workspace */}
      {google.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Database size={14} className="text-green-400" />
            Google Workspace Backup ({google.length} customers)
          </h3>
          <div className="space-y-1.5">
            {google.map(customer => (
              <SaaSCustomerRow key={customer.id} customer={customer} apps={apps.filter(a => a.domain === customer.domain)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── SaaS Customer Row ───────────────────────────────────────

function SaaSCustomerRow({ customer, apps }: { customer: DattoSaaSCustomer; apps: DattoSaaSApplication[] }) {
  const [expanded, setExpanded] = useState(false)
  const seatPercent = Math.round((customer.seatsUsed / customer.seatsAvailable) * 100)

  const appIcons: Record<string, string> = {
    exchange: '📧', onedrive: '☁️', sharepoint: '📂', teams: '💬',
    gmail: '📧', gdrive: '☁️', contacts: '👤', calendar: '📅',
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</p>
          <p className="text-xs text-gray-500">{customer.domain} · {customer.seatsUsed}/{customer.seatsAvailable} seats ({seatPercent}%)</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-gray-500">
            {customer.lastBackupDate ? formatTimeAgo(new Date(customer.lastBackupDate)) : 'Never'}
          </span>
          {expanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
        </div>
      </button>

      {expanded && apps.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {apps.map(app => (
              <div key={app.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <span>{appIcons[app.type] || '📦'}</span>
                <div>
                  <p className="text-xs font-medium text-gray-900 dark:text-white capitalize">{app.type}</p>
                  <p className="text-[10px] text-gray-500">{app.protectedSeats}/{app.totalSeats} seats · {formatBytes(app.storageUsedBytes)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Activity Tab ────────────────────────────────────────────

function ActivityTab({ activity }: { activity: DattoActivityLog[] }) {
  return (
    <div className="space-y-1.5">
      {activity.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
      ) : (
        activity.map((entry, i) => {
          const isError = entry.action.toLowerCase().includes('failed') || entry.action.toLowerCase().includes('alert')
          const isSuccess = entry.action.toLowerCase().includes('completed') || entry.action.toLowerCase().includes('passed')

          return (
            <div key={i} className="flex items-start gap-3 px-4 py-2.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className={`mt-0.5 ${isError ? 'text-red-400' : isSuccess ? 'text-green-400' : 'text-gray-400'}`}>
                {isError ? <XCircle size={14} /> : isSuccess ? <CheckCircle2 size={14} /> : <Activity size={14} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900 dark:text-white">{entry.action}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span>{entry.clientCompanyName}</span>
                  {entry.details && <span>· {entry.details}</span>}
                  <span>· {formatTimeAgo(new Date(entry.timestamp))}</span>
                </div>
              </div>
              <span className="text-[10px] text-gray-400 flex-shrink-0">{entry.user}</span>
            </div>
          )
        })
      )}
    </div>
  )
}

// ── Utility Components ──────────────────────────────────────

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-xs text-gray-900 dark:text-white font-mono mt-0.5">{value}</p>
    </div>
  )
}

// ── Utility Functions ───────────────────────────────────────

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
