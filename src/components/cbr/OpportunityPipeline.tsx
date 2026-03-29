'use client'

// ============================================================
// OpportunityPipeline — RX Skin
// Opportunity list grouped by status, with filter and
// probability badges.
// ============================================================

import { useState, useMemo } from 'react'
import { Lightbulb, AlertTriangle, RefreshCw } from 'lucide-react'
import { useCBROpportunities } from '@/hooks/useCBRData'
import type { CBROpportunity } from '@/types/cbr'

// ── Helpers ─────────────────────────────────────────────────

type OppFilter = 'all' | 'active' | 'won' | 'lost'

function getStatusBadge(status: string | undefined, isActive: boolean): { class: string; label: string } {
  const s = status?.toLowerCase() ?? ''
  if (s.includes('won') || s.includes('closed won')) {
    return { class: 'bg-emerald-500/10 text-emerald-500', label: status ?? 'Won' }
  }
  if (s.includes('lost') || s.includes('closed lost')) {
    return { class: 'bg-red-500/10 text-red-500', label: status ?? 'Lost' }
  }
  if (isActive) {
    return { class: 'bg-blue-500/10 text-blue-500', label: status ?? 'Active' }
  }
  return { class: 'bg-gray-500/10 text-gray-500', label: status ?? 'Unknown' }
}

function matchesFilter(opp: CBROpportunity, filter: OppFilter): boolean {
  if (filter === 'all') return true
  const s = opp.status?.toLowerCase() ?? ''
  if (filter === 'active') return opp.isActive
  if (filter === 'won') return s.includes('won')
  if (filter === 'lost') return s.includes('lost')
  return true
}

// ── Loading Skeleton ────────────────────────────────────────

function OppSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 h-20" />
      ))}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────

export function OpportunityPipeline({ clientId }: { clientId: string }) {
  const { data, isLoading, isError, error, refetch } = useCBROpportunities(clientId)
  const [filter, setFilter] = useState<OppFilter>('all')

  const filtered = useMemo(() => {
    if (!data?.opportunities) return []
    return data.opportunities.filter(o => matchesFilter(o, filter))
  }, [data?.opportunities, filter])

  // Group by stage
  const grouped = useMemo(() => {
    const groups: Record<string, CBROpportunity[]> = {}
    for (const opp of filtered) {
      const stage = opp.stage ?? 'No Stage'
      if (!groups[stage]) groups[stage] = []
      groups[stage].push(opp)
    }
    return groups
  }, [filtered])

  if (isLoading) return <OppSkeleton />

  if (isError) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {error instanceof Error ? error.message : 'Failed to load opportunities'}
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
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'active', 'won', 'lost'] as OppFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors capitalize ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grouped opportunities */}
      {Object.keys(grouped).length === 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
          No opportunities match the selected filter.
        </div>
      )}

      {Object.entries(grouped).map(([stage, opps]) => (
        <div key={stage}>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {stage} ({opps.length})
          </h3>
          <div className="space-y-2">
            {opps.map(opp => {
              const badge = getStatusBadge(opp.status, opp.isActive)
              return (
                <div
                  key={opp.id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Lightbulb className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {opp.title}
                        </p>
                        {opp.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {opp.description}
                          </p>
                        )}
                        {opp.clientName && (
                          <p className="text-xs text-gray-400 mt-1">{opp.clientName}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.class}`}>
                        {badge.label}
                      </span>
                      {opp.probability != null && (
                        <span className="text-xs text-gray-500">{opp.probability}%</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
