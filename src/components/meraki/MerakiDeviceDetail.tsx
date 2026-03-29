'use client'

import { useEffect, useRef } from 'react'
import { X, Wifi, Server, Shield, Monitor } from 'lucide-react'
import { useMerakiSwitchPorts, useMerakiUplinks } from '@/hooks/useMerakiData'
import type { MerakiDeviceStatus, MerakiUplink } from '@/types/meraki'

interface Props {
  device: MerakiDeviceStatus
  onClose: () => void
}

function statusDot(status: string) {
  const colors: Record<string, string> = {
    online: 'bg-green-500',
    alerting: 'bg-amber-500',
    offline: 'bg-red-500',
    dormant: 'bg-gray-400',
    Connected: 'bg-green-500',
    Disconnected: 'bg-gray-400',
    Disabled: 'bg-red-500',
    active: 'bg-green-500',
    ready: 'bg-blue-400',
    connecting: 'bg-amber-400',
    failed: 'bg-red-500',
    'not connected': 'bg-gray-400',
  }
  return colors[status] ?? 'bg-gray-400'
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 dark:text-white text-right font-mono text-xs">{value}</span>
    </div>
  )
}

function SwitchPortsSection({ serial }: { serial: string }) {
  const { data, isLoading } = useMerakiSwitchPorts(serial)
  const ports = data?.data ?? []

  if (isLoading) return (
    <div className="space-y-1">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-8 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
      ))}
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-500 border-b border-gray-100 dark:border-gray-800">
            <th className="text-left pb-2 font-medium">Port</th>
            <th className="text-left pb-2 font-medium">Name</th>
            <th className="text-left pb-2 font-medium">Status</th>
            <th className="text-left pb-2 font-medium hidden sm:table-cell">Speed</th>
            <th className="text-left pb-2 font-medium hidden sm:table-cell">Clients</th>
            <th className="text-left pb-2 font-medium hidden md:table-cell">PoE</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {ports.map(port => (
            <tr key={port.portId}>
              <td className="py-1.5 font-mono font-medium text-gray-900 dark:text-white">{port.portId}</td>
              <td className="py-1.5 text-gray-600 dark:text-gray-400">
                {port.lldp?.systemName ?? '—'}
              </td>
              <td className="py-1.5">
                <span className={`inline-flex items-center gap-1`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot(port.status)}`} />
                  <span className={`
                    ${port.status === 'Connected' ? 'text-green-600 dark:text-green-400' : ''}
                    ${port.status === 'Disconnected' ? 'text-gray-400' : ''}
                    ${port.status === 'Disabled' ? 'text-red-500' : ''}
                  `}>{port.status}</span>
                </span>
              </td>
              <td className="py-1.5 text-gray-500 hidden sm:table-cell">{port.speed ?? '—'}</td>
              <td className="py-1.5 text-gray-900 dark:text-white hidden sm:table-cell">{port.clientCount}</td>
              <td className="py-1.5 hidden md:table-cell">
                {port.powerUsageInWh != null
                  ? <span className="text-green-600 dark:text-green-400">{port.powerUsageInWh.toFixed(1)}W</span>
                  : <span className="text-gray-400">—</span>
                }
              </td>
            </tr>
          ))}
          {ports.length === 0 && (
            <tr><td colSpan={6} className="py-4 text-center text-gray-500">No port data</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function UplinkSection({ uplinks }: { uplinks?: MerakiUplink[] }) {
  if (!uplinks?.length) return <p className="text-sm text-gray-500">No uplink data available.</p>

  return (
    <div className="space-y-3">
      {uplinks.map(uplink => (
        <div key={uplink.interface} className="rounded-lg border border-gray-100 dark:border-gray-800 p-3 space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${statusDot(uplink.status)}`} />
            <span className="text-sm font-medium text-gray-900 dark:text-white uppercase">{uplink.interface}</span>
            <span className="text-xs text-gray-500">{uplink.status}</span>
            {uplink.provider && <span className="text-xs text-gray-400">· {uplink.provider}</span>}
          </div>
          <InfoRow label="IP" value={uplink.ip} />
          <InfoRow label="Gateway" value={uplink.gateway} />
          <InfoRow label="Public IP" value={uplink.publicIp} />
          <InfoRow label="DNS Primary" value={uplink.primaryDns} />
          <InfoRow label="DNS Secondary" value={uplink.secondaryDns} />
          {uplink.connectionType && <InfoRow label="Connection" value={uplink.connectionType} />}
        </div>
      ))}
    </div>
  )
}

export function MerakiDeviceDetail({ device, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const isSwitch = device.productType === 'switch'
  const isAppliance = device.productType === 'appliance'

  const { data: uplinksRes } = useMerakiUplinks()
  const deviceUplinks = uplinksRes?.data?.find(u => u.serial === device.serial)?.uplinks

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const productIcon = isSwitch ? Server : isAppliance ? Shield : Wifi
  const ProductIcon = productIcon

  const statusBadgeColor: Record<string, string> = {
    online: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    alerting: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    offline: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    dormant: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={overlayRef}
        className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/50 rounded-t-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-5 py-4 flex items-start justify-between gap-3 rounded-t-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <ProductIcon className="w-4 h-4 text-green-500" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 dark:text-white truncate">{device.name || device.serial}</h2>
              <p className="text-xs text-gray-500">{device.model} · {device.serial}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusBadgeColor[device.status] ?? statusBadgeColor.dormant}`}>
              {device.status}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* General Info */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">General Info</h3>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 px-4 py-2">
              <InfoRow label="Product Type" value={device.productType} />
              <InfoRow label="LAN IP" value={device.lanIp} />
              <InfoRow label="Public IP" value={device.publicIp} />
              <InfoRow label="Gateway" value={device.gateway} />
              <InfoRow label="Primary DNS" value={device.primaryDns} />
              <InfoRow label="Secondary DNS" value={device.secondaryDns} />
              <InfoRow label="Last Reported" value={device.lastReportedAt ? new Date(device.lastReportedAt).toLocaleString() : null} />
              {device.usingCellularFailover && (
                <div className="flex justify-between gap-4 py-1.5 text-sm">
                  <span className="text-gray-500">Cellular Failover</span>
                  <span className="text-amber-500 font-medium">Active</span>
                </div>
              )}
            </div>
          </div>

          {/* Switch Ports */}
          {isSwitch && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Switch Ports</h3>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-4">
                <SwitchPortsSection serial={device.serial} />
              </div>
            </div>
          )}

          {/* Appliance Uplinks */}
          {isAppliance && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">WAN Uplinks</h3>
              <UplinkSection uplinks={deviceUplinks} />
            </div>
          )}

          {/* Wireless AP Info */}
          {device.productType === 'wireless' && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Access Point</h3>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    SSID and client data available in the Networks tab.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
