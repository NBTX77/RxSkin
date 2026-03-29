'use client'

// ============================================================
// InitiativesTimeline — RX Skin
// Initiative cards with collapsible executive summaries,
// budget breakdowns, and fiscal quarter grouping.
// ============================================================

import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle, RefreshCw } from 'lucide-react'
import { useCBRInitiatives } from '@/hooks/useCBRData'
import type { CBRInitiative } from '@/types/cbr'

// ── Helpers ─────────────────────────────────────────────────

function formatCurrency(cents: number): string {
  const dollars = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(dollars)
}

const STATUS_BADGE: Record<string, string> = {
  New: 'bg-blue-500/10 text-blue-500',
  'In Progress': 'bg-yellow-500/10 text-yellow-500',
  Complete: 'bg-emerald-500/10 text-emerald-500',
}

function getStatusBadge(status: string | undefined): string {
  return STATUS_BADGE[status ?? ''] ?? 'bg-gray-500/10 text-gray-500'
}

// ── Loading Skeleton ────────────────────────────────────────

function InitSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 h-32" />
      ))}
    </div>
  )
}

// ── Initiative Card ─────────────────────────────────────────

function InitiativeCard({ initiative }: { initiative: CBRInitiative }) {
  const [expanded, setExpanded] = useState(false)
  const summary = initiative.executiveSummary ?? ''
  const isLong = summary.length > 150

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            {initiative.name}
          </h4>
          {initiative.fiscalQuarter && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {initiative.fiscalQuarter}
            </span>
          )}
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusBadge(initiative.status)}`}>
          {initiative.status ?? 'Unknown'}
        </span>
      </div>

      {/* Executive summary */}
      {summary && (
        <div className="mb-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {expanded || !isLong ? summary : `${summary.slice(0, 150)}...`}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 mt-1 font-medium"
            >
              {expanded ? (
                <>Show less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Show more <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}
        </div>
      )}

      {/* Budget breakdown */}
      {initiative.budgetItems.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-800 pt-2 mt-2">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Budget</p>
          <div className="space-y-1">
            {initiative.budgetItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400 truncate mr-2">{item.label}</span>
                <span className="text-gray-900 dark:text-white font-medium flex-shrink-0">
                  {formatCurrency(item.costCents)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Total</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {formatCurrency(initiative.totalBudgetCents)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────

export function InitiativesTimeline({ clientId }: { clientId: string }) {
  const { data, isLoading, isError, error, refetch } = useCBRInitiatives(clientId)

  if (isLoading) return <InitSkeleton />

  if (isError) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {error instanceof Error ? error.message : 'Failed to load initiatives'}
        </p>
        <button onClick={() => refetch()} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    )
  }

  const initiatives = data?.initiatives ?? []

  if (initiatives.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        No initiatives found for this client.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {initiatives.map(initiative => (
        <InitiativeCard key={initiative.id} initiative={initiative} />
      ))}
    </div>
  )
}
