'use client'

// ============================================================
// ContractSummary — RX Skin
// Contract table with expiration highlighting and status info.
// ============================================================

import { useMemo } from 'react'
import { AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useCBRContracts } from '@/hooks/useCBRData'

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

function isExpiringSoon(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  try {
    const end = new Date(dateStr)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    return diff > 0 && diff <= 90 * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

function isExpired(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  try {
    return new Date(dateStr).getTime() < Date.now()
  } catch {
    return false
  }
}

function getExpiryBadge(endsAt: string | null | undefined): { class: string; label: string } | null {
  if (!endsAt) return null
  if (isExpired(endsAt)) return { class: 'bg-red-500/10 text-red-500', label: 'Expired' }
  if (isExpiringSoon(endsAt)) return { class: 'bg-yellow-500/10 text-yellow-500', label: '<90 Days' }
  return null
}

// ── Loading Skeleton ────────────────────────────────────────

function ContractSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800/50 rounded mb-2" />
        ))}
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────

export function ContractSummary({ clientId }: { clientId: string }) {
  const { data, isLoading, isError, error, refetch } = useCBRContracts(clientId)

  // Sort: expiring soonest first
  const sorted = useMemo(() => {
    const contracts = data?.contracts ?? []
    return [...contracts].sort((a, b) => {
      if (!a.endsAt && !b.endsAt) return 0
      if (!a.endsAt) return 1
      if (!b.endsAt) return -1
      return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime()
    })
  }, [data?.contracts])

  if (isLoading) return <ContractSkeleton />

  if (isError) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {error instanceof Error ? error.message : 'Failed to load contracts'}
        </p>
        <button onClick={() => refetch()} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    )
  }

  if (sorted.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        No contracts found for this client.
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden">
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {['Name', 'Status', 'Billing Period', 'Start', 'End', 'Auto-Renew'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sorted.map(contract => {
              const expiryBadge = getExpiryBadge(contract.endsAt)
              return (
                <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      {contract.name}
                      {expiryBadge && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${expiryBadge.class}`}>
                          {expiryBadge.label}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{contract.status ?? '--'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">{contract.billingPeriod ?? '--'}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDate(contract.startsAt)}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDate(contract.endsAt)}</td>
                  <td className="px-4 py-3">
                    {contract.autoRenew ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <span className="text-gray-400 text-xs">No</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
        {sorted.map(contract => {
          const expiryBadge = getExpiryBadge(contract.endsAt)
          return (
            <div key={contract.id} className="p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white text-sm truncate">{contract.name}</span>
                {expiryBadge && (
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${expiryBadge.class}`}>
                    {expiryBadge.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {contract.status ?? '--'} &middot; {contract.billingPeriod ?? '--'}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatDate(contract.startsAt)} - {formatDate(contract.endsAt)}</span>
                {contract.autoRenew && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
