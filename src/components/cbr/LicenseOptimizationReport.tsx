'use client'

// ============================================================
// LicenseOptimizationReport — RX Skin
// SaaS license utilization table showing capacity, usage,
// and waste with color-coded waste thresholds.
// ============================================================

import { useMemo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useCBRLicenses } from '@/hooks/useCBRData'

// ── Helpers ─────────────────────────────────────────────────

function getWasteClass(wastePercent: number): string {
  if (wastePercent > 30) return 'text-red-500 font-medium'
  if (wastePercent > 15) return 'text-yellow-500 font-medium'
  return 'text-gray-600 dark:text-gray-400'
}

function getWasteBadge(wastePercent: number): string {
  if (wastePercent > 30) return 'bg-red-500/10 text-red-500'
  if (wastePercent > 15) return 'bg-yellow-500/10 text-yellow-500'
  return 'bg-emerald-500/10 text-emerald-500'
}

// ── Loading Skeleton ────────────────────────────────────────

function LicenseSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
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

export function LicenseOptimizationReport({ clientId }: { clientId: string }) {
  const { data, isLoading, isError, error, refetch } = useCBRLicenses(clientId)

  // Compute summary
  const summary = useMemo(() => {
    if (!data?.licenses) return { totalSubscriptions: 0, totalSeats: 0, totalUtilized: 0, totalWasted: 0 }
    return {
      totalSubscriptions: data.licenses.length,
      totalSeats: data.licenses.reduce((sum, l) => sum + l.seatCapacity, 0),
      totalUtilized: data.licenses.reduce((sum, l) => sum + l.seatUtilized, 0),
      totalWasted: data.licenses.reduce((sum, l) => sum + l.seatWaste, 0),
    }
  }, [data?.licenses])

  if (isLoading) return <LicenseSkeleton />

  if (isError) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {error instanceof Error ? error.message : 'Failed to load license data'}
        </p>
        <button onClick={() => refetch()} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    )
  }

  const licenses = data?.licenses ?? []

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Subscriptions</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{summary.totalSubscriptions}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Seats</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{summary.totalSeats}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Utilized</p>
          <p className="text-lg font-bold text-emerald-500">{summary.totalUtilized}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Wasted</p>
          <p className="text-lg font-bold text-red-500">{summary.totalWasted}</p>
        </div>
      </div>

      {/* Table -- Desktop */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['Product', 'Manufacturer', 'Capacity', 'Utilized', 'Waste', 'Waste %'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {licenses.map(lic => (
                <tr key={lic.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{lic.productName ?? '--'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{lic.manufacturer ?? '--'}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{lic.seatCapacity}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{lic.seatUtilized}</td>
                  <td className={`px-4 py-3 ${getWasteClass(lic.wastePercent)}`}>{lic.seatWaste}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getWasteBadge(lic.wastePercent)}`}>
                      {lic.wastePercent.toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
              {licenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No license data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
          {licenses.map(lic => (
            <div key={lic.id} className="p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white text-sm truncate">{lic.productName ?? '--'}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getWasteBadge(lic.wastePercent)}`}>
                  {lic.wastePercent.toFixed(0)}% waste
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {lic.manufacturer ?? '--'} &middot; {lic.seatCapacity} seats &middot; {lic.seatUtilized} used
              </p>
            </div>
          ))}
          {licenses.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
              No license data available.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
