'use client'

import type { AutomateComputer } from '@/types'
import {
  Monitor, Server, Laptop, Cpu, HardDrive, Clock, Globe,
  Shield, RefreshCw, User, Wifi, WifiOff, X, Thermometer,
  AlertTriangle, Network,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SystemInfoPanelProps {
  computer: AutomateComputer
  isOpen: boolean
  onClose: () => void
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  Server: <Server size={16} className="text-purple-400" />,
  Workstation: <Monitor size={16} className="text-blue-400" />,
  Laptop: <Laptop size={16} className="text-cyan-400" />,
}

export function SystemInfoPanel({ computer, isOpen, onClose }: SystemInfoPanelProps) {
  if (!isOpen) return null

  const isOnline = computer.status === 'Online'
  const memUsedGB = Math.round((computer.totalMemoryGB - computer.freeMemoryGB) * 10) / 10
  const memPct = computer.totalMemoryGB > 0
    ? Math.round((memUsedGB / computer.totalMemoryGB) * 100)
    : 0
  const icon = TYPE_ICON[computer.type] ?? <Monitor size={16} className="text-gray-600 dark:text-gray-400" />

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 w-full max-w-md z-50 bg-gray-50 dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                {icon}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-950 ${isOnline ? 'bg-green-500' : 'bg-gray-600'}`} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{computer.computerName}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[11px] font-medium ${isOnline ? 'text-green-400' : 'text-gray-500'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
                <span className="text-[11px] text-gray-600">{computer.clientName}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-white hover:bg-gray-800 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Status alerts */}
          {computer.isRebootNeeded && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <AlertTriangle size={14} className="text-orange-400 flex-shrink-0" />
              <span className="text-xs text-orange-300">Reboot required</span>
            </div>
          )}

          {/* Live metrics (online only) */}
          {isOnline && (
            <div className="grid grid-cols-3 gap-2">
              <MetricCard
                label="CPU"
                value={`${computer.cpuUsage}%`}
                icon={<Cpu size={13} />}
                color={computer.cpuUsage > 80 ? 'red' : computer.cpuUsage > 50 ? 'yellow' : 'green'}
              />
              <MetricCard
                label="Memory"
                value={`${memPct}%`}
                icon={<Thermometer size={13} />}
                color={memPct > 85 ? 'red' : memPct > 60 ? 'yellow' : 'green'}
                sub={`${memUsedGB}/${computer.totalMemoryGB} GB`}
              />
              <MetricCard
                label="Uptime"
                value={`${computer.systemUptimeDays}d`}
                icon={<Clock size={13} />}
                color={computer.systemUptimeDays > 30 ? 'yellow' : 'green'}
              />
            </div>
          )}

          {/* System Info */}
          <InfoSection title="System">
            <InfoRow icon={<Monitor size={13} />} label="OS" value={computer.operatingSystem} />
            <InfoRow icon={<HardDrive size={13} />} label="Type" value={computer.type} />
            <InfoRow icon={<Globe size={13} />} label="Domain" value={computer.domain} />
            <InfoRow icon={<Server size={13} />} label="Manufacturer" value={computer.biosManufacturer} />
            <InfoRow icon={<HardDrive size={13} />} label="Serial" value={computer.serialNumber} />
          </InfoSection>

          {/* Network */}
          <InfoSection title="Network">
            <InfoRow icon={<Network size={13} />} label="Local IP" value={computer.localIP} />
            <InfoRow icon={<Network size={13} />} label="MAC" value={computer.macAddress} />
          </InfoSection>

          {/* Security */}
          <InfoSection title="Security">
            <InfoRow icon={<Shield size={13} />} label="Antivirus" value={computer.antivirusName} />
            <InfoRow
              icon={<Shield size={13} />}
              label="AV Definitions"
              value={formatDateSafe(computer.antivirusDefDate)}
            />
            <InfoRow
              icon={<RefreshCw size={13} />}
              label="Last Windows Update"
              value={formatDateSafe(computer.windowsUpdateDate)}
            />
          </InfoSection>

          {/* Usage */}
          <InfoSection title="Activity">
            <InfoRow icon={<User size={13} />} label="Last User" value={computer.lastUserName} />
            <InfoRow icon={<Wifi size={13} />} label="Last Contact" value={formatAgo(computer.lastContact)} />
            <InfoRow icon={<WifiOff size={13} />} label="Last Heartbeat" value={formatAgo(computer.lastHeartbeat)} />
            <InfoRow icon={<HardDrive size={13} />} label="Temp Files" value={computer.tempFiles} />
          </InfoSection>
        </div>
      </div>
    </>
  )
}

function MetricCard({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: 'green' | 'yellow' | 'red'
  sub?: string
}) {
  const colorMap = {
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
  }

  return (
    <div className={`text-center p-3 rounded-lg border ${colorMap[color]}`}>
      <div className="flex items-center justify-center gap-1 mb-1">{icon}</div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
      {sub && <p className="text-[9px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  )
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-900 p-4 space-y-3">
      <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  if (!value || value === 'undefined') return null
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-xs text-gray-500">
        {icon}
        {label}
      </span>
      <span className="text-xs text-gray-700 dark:text-gray-300 font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  )
}

function formatDateSafe(dateStr: string): string {
  if (!dateStr || dateStr.startsWith('0001')) return 'N/A'
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}

function formatAgo(dateStr: string): string {
  if (!dateStr) return 'N/A'
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}
