'use client'

// ============================================================
// HardwareHealthReport — RX Skin
// Hardware assets table with warranty status color coding
// and type/status filters.
// ============================================================

import { useState, useMemo } from 'react'
import { Monitor, AlertTriangle, RefreshCw } from 'lucide-react'
import { useCBRHardware } from '@/hooks/useCBRData'
import type { CBRHardwareLifecycle } from '@/types/cbr'

// ── Helpers ─────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '--'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function getWarrantyStatus(lifecycle: CBRHardwareLifecycle | undefined): 'covered' | 'expiring' | 'expired' | 'unknown' {
  if (!lifecycle) return 'unknown'
  if (lifecycle.isWarrantyExpired) return 'expired'
  if (lifecycle.warrantyDaysRemaining !== null && lifecycle.warrantyDaysRemaining <= 90) return 'expiring'
  if (lifecycle.warrantyDaysRemaining !== null && lifecycle.warrantyDaysRemaining > 90) return 'covered'
  return 'unknown'
}

const WARRANTY_BADGE: Record<string, string> = {
  covered: 'bg-emerald-500/10 text-emerald-500',
  expiring: 'bg-yellow-500/10 text-yellow-500',
  expired: 'bg-red-500/10 text-red-500',
  unknown: 'bg-gray-500/10 text-gray-500',
}

const WARRANTY_LABEL: Record<string, string> = {
  covered: 'Covered',
  expiring: 'Expiring Soon',
  expired: 'Expired',
  unknown: 'Unknown',
}

// ── Loading Skeleton ────────────────────────────────────────

function HardwareSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 h-16" />
        ))}
      </div>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800/50 rounded mb-2" />
        ))}
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────

export function HardwareHealthReport({ clientId }: { clientId: string }) {
  const { data, isLoading, isError, error, refetch } = useCBRHardware(clientId)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [warrantyFilter, setWarrantyFilter] = useState<string>('all')

  // Build lifecycle lookup by serial number
  const lifecycleMap = useMemo(() => {
    const map = new Map<string, CBRHardwareLifecycle>()
    if (data?.lifecycles) {
      for (const lc of data.lifecycles) {
        if (lc.serialNumber) map.set(lc.serialNumber, lc)
      }
    }
    return map
  }, [data?.lifecycles])

  // Compute summary stats
  const summary = useMemo(() => {
    if (!data?.assets) return { total: 0, expired: 0, expiringSoon: 0 }
    let expired = 0
    let expiringSoon = 0
    for (const asset of data.assets) {
      const lc = asset.serialNumber ? lifecycleMap.get(asset.serialNumber) : undefined
      const status = getWarrantyStatus(lc)
      if (status === 'expired') expired++
      if (status === 'expiring') expiringSoon++
    }
    return { total: data.assets.length, expired, expiringSoon }
  }, [data?.assets, lifecycleMap])

  // Unique types for filter
  const types = useMemo(() => {
    if (!data?.assets) return []
    const s = new Set(data.assets.map(a => a.type ?? 'Unknown').filter(Boolean))
    return Array.from(s).sort()
  }, [data?.assets])

  // Filtered assets
  const filtered = useMemo(() => {
    if (!data?.assets) return []
    return data.assets.filter(asset => {
      const assetType = asset.type ?? 'Unknown'
      if (typeFilter !== 'all' && assetType !== typeFilter) return false
      if (warrantyFilter !== 'all') {
        const lc = asset.serialNumber ? lifecycleMap.get(asset.serialNumber) : undefined
        const status = getWarrantyStatus(lc)
        if (warrantyFilter !== status) return false
      }
      return true
    })
  }, [data?.assets, typeFilter, warrantyFilter, lifecycleMap])

  if (isLoading) return <HardwareSkeleton />

  if (isError) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {error instanceof Error ? error.message : 'Failed to load hardware data'}
        </p>
        <button onClick={() => refetch()} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-cyan-500"><Monitor className="w-3.5 h-3.5 text-white" /></div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Devices</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{summary.total}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-red-500"><AlertTriangle className="w-3.5 h-3.5 text-white" /></div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Expired Warranty</p>
            <p className="text-lg font-bold text-red-500">{summary.expired}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-yellow-500"><AlertTriangle className="w-3.5 h-3.5 text-white" /></div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Expiring &lt;90 Days</p>
            <p className="text-lg font-bold text-yellow-500">{summary.expiringSoon}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 rounded-lg text-gray-900 dark:text-white"
        >
          <option value="all">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={warrantyFilter}
          onChange={e => setWarrantyFilter(e.target.value)}
          className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 rounded-lg text-gray-900 dark:text-white"
        >
          <option value="all">All Warranty Status</option>
          <option value="covered">Covered</option>
          <option value="expiring">Expiring Soon</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table -- Desktop */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['Name', 'Type', 'Manufacturer', 'Model', 'OS', 'Warranty', 'Expiry'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map(asset => {
                const lc = asset.serialNumber ? lifecycleMap.get(asset.serialNumber) : undefined
                const status = getWarrantyStatus(lc)
                return (
                  <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{asset.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{asset.type ?? '--'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{asset.manufacturer ?? '--'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{asset.model ?? '--'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[160px] truncate">{asset.os ?? '--'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${WARRANTY_BADGE[status]}`}>
                        {WARRANTY_LABEL[status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {formatDate(lc?.warrantyExpiryDate)}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No hardware assets match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
          {filtered.map(asset => {
            const lc = asset.serialNumber ? lifecycleMap.get(asset.serialNumber) : undefined
            const status = getWarrantyStatus(lc)
            return (
              <div key={asset.id} className="p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white text-sm truncate">{asset.name}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${WARRANTY_BADGE[status]}`}>
                    {WARRANTY_LABEL[status]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {asset.type ?? '--'} &middot; {asset.manufacturer ?? '--'} {asset.model ?? ''}
                </p>
                <p className="text-xs text-gray-500">
                  Warranty: {formatDate(lc?.warrantyExpiryDate)}
                </p>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
              No hardware assets match the current filters.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
