'use client'

import { useEffect } from 'react'
import { X, Network, ArrowLeft } from 'lucide-react'
import { useMerakiClients, useMerakiSSIDs, useMerakiDevices } from '@/hooks/useMerakiData'
import type { MerakiNetwork, MerakiNetworkSummary } from '@/types/meraki'

interface Props {
  network: MerakiNetwork
  summary?: MerakiNetworkSummary
  onClose: () => void
}

function bytesToMB(kb: number) {
  if (kb < 1024) return `${kb} KB`
  const mb = kb / 1024
  return mb < 1024 ? `${mb.toFixed(1)} MB` : `${(mb / 1024).toFixed(2)} GB`
}

export function MerakiNetworkDetail({ network, summary, onClose }: Props) {
  const { data: clientsRes, isLoading: clientsLoading } = useMerakiClients(network.id)
  const { data: ssidsRes } = useMerakiSSIDs(network.id)
  const { data: devicesRes } = useMerakiDevices()

  const clients = (clientsRes?.data ?? [])
    .sort((a, b) => (b.usage.sent + b.usage.recv) - (a.usage.sent + a.usage.recv))

  const ssids = (ssidsRes?.data ?? []).filter(s => s.enabled)

  const networkDevices = (devicesRes?.data ?? []).filter(d => d.networkId === network.id)

  const hasWireless = network.productTypes?.includes('wireless')

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleBackdrop}
    >
      <div className="w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/50 rounded-t-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-5 py-4 flex items-start justify-between gap-3 rounded-t-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Network className="w-4 h-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 dark:text-white truncate">{network.name}</h2>
              <p className="text-xs text-gray-500">{network.productTypes?.join(' · ')} · {network.timeZone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Summary KPIs */}
          {summary && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {[
                { label: 'Devices', value: summary.deviceCount, color: '' },
                { label: 'Online', value: summary.onlineDevices, color: 'text-green-500' },
                { label: 'Offline', value: summary.offlineDevices, color: summary.offlineDevices > 0 ? 'text-red-500' : '' },
                { label: 'Alerting', value: summary.alertingDevices, color: summary.alertingDevices > 0 ? 'text-amber-500' : '' },
                { label: 'Clients', value: summary.clientCount, color: '' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-3 text-center">
                  <p className={`text-xl font-bold ${color || 'text-gray-900 dark:text-white'}`}>{value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Devices in this network */}
          {networkDevices.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Devices ({networkDevices.length})
              </h3>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {networkDevices.map(dev => (
                      <tr key={dev.serial} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-2.5">
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            dev.status === 'online' ? 'bg-green-500' :
                            dev.status === 'alerting' ? 'bg-amber-500' :
                            dev.status === 'offline' ? 'bg-red-500' : 'bg-gray-400'
                          }`} />
                          <span className="font-medium text-gray-900 dark:text-white">{dev.name || dev.serial}</span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{dev.model}</td>
                        <td className="px-4 py-2.5 text-gray-400 font-mono text-xs hidden sm:table-cell">{dev.serial}</td>
                        <td className="px-4 py-2.5 hidden md:table-cell">
                          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">{dev.productType}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top Clients */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Top Clients by Usage
            </h3>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 overflow-hidden">
              {clientsLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Client</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden sm:table-cell">IP</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden md:table-cell">VLAN</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Usage</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden lg:table-cell">OS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {clients.slice(0, 20).map(client => (
                        <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-2.5">
                            <p className="font-medium text-gray-900 dark:text-white text-xs">{client.description || client.mac}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{client.mac}</p>
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 font-mono text-xs hidden sm:table-cell">{client.ip || '—'}</td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs hidden md:table-cell">{client.vlan ?? '—'}</td>
                          <td className="px-4 py-2.5 text-right text-xs">
                            <p className="text-gray-900 dark:text-white">{bytesToMB(client.usage.sent + client.usage.recv)}</p>
                            <p className="text-[10px] text-gray-400">↑{bytesToMB(client.usage.sent)} ↓{bytesToMB(client.usage.recv)}</p>
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs hidden lg:table-cell">{client.os || '—'}</td>
                        </tr>
                      ))}
                      {clients.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No clients found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* SSIDs (wireless networks only) */}
          {hasWireless && ssids.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Active SSIDs ({ssids.length})
              </h3>
              <div className="space-y-2">
                {ssids.map(ssid => (
                  <div key={ssid.number} className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{ssid.name}</p>
                      <p className="text-xs text-gray-500">{ssid.authMode}{ssid.encryptionMode ? ` · ${ssid.encryptionMode}` : ''}</p>
                    </div>
                    <div className="text-right text-xs shrink-0">
                      {ssid.bandSelection && <p className="text-gray-500">{ssid.bandSelection}</p>}
                      {ssid.visible ? (
                        <span className="text-green-600 dark:text-green-400">Visible</span>
                      ) : (
                        <span className="text-gray-400">Hidden</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {network.tags?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {network.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
