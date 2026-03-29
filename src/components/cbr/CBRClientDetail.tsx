'use client'

// ============================================================
// CBRClientDetail — RX Skin
// Client detail view with health score gauge, KPI strip,
// tabbed navigation for Hardware, Licenses, Opportunities,
// Contracts, and Initiatives.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Monitor,
  KeyRound,
  FileCheck,
  Lightbulb,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { KPICard } from '@/components/ui/KPICard'
import { useCBRClientOverview } from '@/hooks/useCBRData'
import type { HealthFactor } from '@/types/cbr'
import { ClientHealthScore } from './ClientHealthScore'
import { HardwareHealthReport } from './HardwareHealthReport'
import { LicenseOptimizationReport } from './LicenseOptimizationReport'
import { OpportunityPipeline } from './OpportunityPipeline'
import { ContractSummary } from './ContractSummary'
import { InitiativesTimeline } from './InitiativesTimeline'

// ── Types ───────────────────────────────────────────────────

type TabKey = 'overview' | 'hardware' | 'licenses' | 'opportunities' | 'contracts' | 'initiatives'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'hardware', label: 'Hardware' },
  { key: 'licenses', label: 'Licenses' },
  { key: 'opportunities', label: 'Opportunities' },
  { key: 'contracts', label: 'Contracts' },
  { key: 'initiatives', label: 'Initiatives' },
]

// ── Score Color ─────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-500'
  if (score >= 60) return 'text-yellow-500'
  if (score >= 40) return 'text-orange-500'
  return 'text-red-500'
}

function getScoreBarColor(pct: number): string {
  if (pct >= 75) return 'bg-emerald-500'
  if (pct >= 60) return 'bg-yellow-500'
  if (pct >= 40) return 'bg-orange-500'
  return 'bg-red-500'
}

function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

// ── Loading Skeleton ────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-6">
          <div className="flex items-center gap-6">
            <div className="w-[120px] h-[120px] bg-gray-200 dark:bg-gray-800 rounded-full" />
            <div className="space-y-3 flex-1">
              <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 h-16" />
          ))}
        </div>
        <div className="h-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg" />
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────

export function CBRClientDetail({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const { data, isLoading, isError, error, refetch } = useCBRClientOverview(clientId)

  if (isLoading) return <DetailSkeleton />

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Failed to load client data
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-4">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  const { client, healthScore } = data

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* BACK BUTTON */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* CLIENT HEADER */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ClientHealthScore
              score={healthScore.overall}
              grade={healthScore.grade ?? scoreToGrade(healthScore.overall)}
              size="lg"
            />
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {client.name}
              </h1>
              {client.domain && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {client.domain}
                </p>
              )}
              <p className={`text-sm font-medium mt-2 ${getScoreColor(healthScore.overall)}`}>
                Health Score: {healthScore.overall}/100
              </p>
            </div>
          </div>
        </div>

        {/* KPI STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <KPICard label="Hardware Score" value={String(healthScore.hardware)} icon={Monitor} color="bg-cyan-500" />
          <KPICard label="Software Score" value={String(healthScore.software)} icon={KeyRound} color="bg-purple-500" />
          <KPICard label="Contract Score" value={String(healthScore.contracts)} icon={FileCheck} color="bg-orange-500" />
          <KPICard label="Opportunity Score" value={String(healthScore.opportunities)} icon={Lightbulb} color="bg-emerald-500" />
        </div>

        {/* TAB NAVIGATION */}
        <div className="border-b border-gray-200 dark:border-gray-700/50 overflow-x-auto">
          <nav className="flex gap-1 min-w-max" aria-label="Client detail tabs">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* TAB CONTENT */}
        <div>
          {activeTab === 'overview' && (
            <OverviewTab factors={healthScore.factors} />
          )}
          {activeTab === 'hardware' && (
            <HardwareHealthReport clientId={clientId} />
          )}
          {activeTab === 'licenses' && (
            <LicenseOptimizationReport clientId={clientId} />
          )}
          {activeTab === 'opportunities' && (
            <OpportunityPipeline clientId={clientId} />
          )}
          {activeTab === 'contracts' && (
            <ContractSummary clientId={clientId} />
          )}
          {activeTab === 'initiatives' && (
            <InitiativesTimeline clientId={clientId} />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Overview Tab ────────────────────────────────────────────

function OverviewTab({ factors }: { factors: HealthFactor[] }) {
  if (!factors || factors.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        No health factor data available.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {factors.map(factor => {
        const pct = factor.weight > 0 ? Math.round((factor.score / factor.weight) * 100) : 0
        return (
          <div
            key={factor.label}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {factor.category}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {factor.label}
              </h3>
              <span className={`text-sm font-bold ${getScoreColor(pct)}`}>
                {factor.score}/{factor.weight}
              </span>
            </div>
            {/* Score bar */}
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-3">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(pct)}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {factor.detail}
            </p>
            {factor.recommendation && (
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {factor.recommendation}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
