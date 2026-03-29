'use client'

// ============================================================
// CBRDashboard — RX Skin
// Client Business Review dashboard showing all clients with
// health grades, device counts, and opportunities.
// ============================================================

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Monitor,
  KeyRound,
  Lightbulb,
  FileCheck,
  Users,
  Search,
  ArrowUpDown,
  RefreshCw,
  AlertTriangle,
  Settings,
} from 'lucide-react'
import { KPICard } from '@/components/ui/KPICard'
import { useCBRClients } from '@/hooks/useCBRData'
import type { CBRClient } from '@/types/cbr'

// ── Health Grade Badge ──────────────────────────────────────

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-emerald-500/10 text-emerald-500',
  B: 'bg-blue-500/10 text-blue-500',
  C: 'bg-yellow-500/10 text-yellow-500',
  D: 'bg-orange-500/10 text-orange-500',
  F: 'bg-red-500/10 text-red-500',
}

function HealthGradeBadge({ grade }: { grade: string }) {
  const colorClass = GRADE_COLORS[grade] ?? 'bg-gray-500/10 text-gray-500'
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${colorClass}`}>
      {grade}
    </span>
  )
}

// ── Helpers ─────────────────────────────────────────────────

function getHealthGrade(lifecycle: string): string {
  // Map ScalePad lifecycle values to letter grades
  const lower = lifecycle?.toLowerCase() ?? ''
  if (lower.includes('active') || lower === 'a') return 'A'
  if (lower.includes('good') || lower === 'b') return 'B'
  if (lower.includes('fair') || lower === 'c') return 'C'
  if (lower.includes('poor') || lower === 'd') return 'D'
  if (lower.includes('critical') || lower === 'f') return 'F'
  return 'C' // default
}

type SortKey = 'name' | 'healthGrade' | 'deviceCount' | 'lastUpdated'
type SortDir = 'asc' | 'desc'

const GRADE_ORDER: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, F: 5 }

function sortClients(clients: CBRClient[], key: SortKey, dir: SortDir): CBRClient[] {
  return [...clients].sort((a, b) => {
    let cmp = 0
    switch (key) {
      case 'name':
        cmp = a.name.localeCompare(b.name)
        break
      case 'healthGrade': {
        const gradeA = getHealthGrade(a.lifecycle)
        const gradeB = getHealthGrade(b.lifecycle)
        cmp = (GRADE_ORDER[gradeA] ?? 99) - (GRADE_ORDER[gradeB] ?? 99)
        break
      }
      case 'deviceCount':
        cmp = a.hardwareAssetCount - b.hardwareAssetCount
        break
      case 'lastUpdated':
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        break
    }
    return dir === 'asc' ? cmp : -cmp
  })
}

function formatDate(dateStr: string): string {
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

// ── Loading Skeleton ────────────────────────────────────────

function CBRSkeleton() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 animate-pulse">
        <div>
          <div className="h-8 w-56 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded mt-2" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-lg mb-3" />
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
              <div className="h-7 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800/50 rounded mb-2" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Error State ─────────────────────────────────────────────

function CBRError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const isConfigError = message.includes('SCALEPAD') || message.includes('configure') || message.includes('401') || message.includes('403')

  if (isConfigError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-yellow-50 dark:bg-yellow-950/30 flex items-center justify-center mb-4">
          <Settings size={32} className="text-yellow-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          ScalePad Not Configured
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-4">
          The CBR Dashboard requires a ScalePad API key. Go to Admin &rarr; Integrations to configure your ScalePad credentials.
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4">
        <AlertTriangle size={32} className="text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Failed to load CBR data
      </h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────

export function CBRDashboard() {
  const router = useRouter()
  const { data, isLoading, isError, error, refetch } = useCBRClients()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filteredClients = useMemo(() => {
    if (!data?.clients) return []
    const q = search.toLowerCase()
    const filtered = q
      ? data.clients.filter(c => c.name.toLowerCase().includes(q))
      : data.clients
    return sortClients(filtered, sortKey, sortDir)
  }, [data?.clients, search, sortKey, sortDir])

  // Compute aggregate KPIs
  const totalDevices = useMemo(() => data?.clients.reduce((sum, c) => sum + c.hardwareAssetCount, 0) ?? 0, [data?.clients])
  const totalContacts = useMemo(() => data?.clients.reduce((sum, c) => sum + c.contactCount, 0) ?? 0, [data?.clients])

  if (isLoading) return <CBRSkeleton />
  if (isError) {
    return <CBRError message={error instanceof Error ? error.message : 'An unexpected error occurred'} onRetry={() => refetch()} />
  }
  if (!data) return null

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Client Business Reviews
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              ScalePad-powered client health overview
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* KPI STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <KPICard label="Total Clients" value={String(data.clients.length)} icon={Users} color="bg-blue-500" />
          <KPICard label="Total Devices" value={String(totalDevices)} icon={Monitor} color="bg-cyan-500" />
          <KPICard label="Contacts" value={String(totalContacts)} icon={KeyRound} color="bg-purple-500" />
          <KPICard label="Opportunities" value="--" icon={Lightbulb} color="bg-emerald-500" subtitle="Select a client" />
          <KPICard label="Contracts" value="--" icon={FileCheck} color="bg-orange-500" subtitle="Select a client" />
        </div>

        {/* SEARCH */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        {/* CLIENT TABLE -- Desktop */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {([
                    ['name', 'Name'],
                    ['healthGrade', 'Health'],
                    ['deviceCount', 'Devices'],
                    ['lastUpdated', 'Last Updated'],
                  ] as [SortKey, string][]).map(([key, label]) => (
                    <th
                      key={key}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      onClick={() => toggleSort(key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        <ArrowUpDown className={`w-3 h-3 ${sortKey === key ? 'text-blue-400' : 'text-gray-400'}`} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredClients.map(client => (
                  <tr
                    key={client.id}
                    onClick={() => router.push(`/cbr/${client.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {client.name}
                    </td>
                    <td className="px-4 py-3">
                      <HealthGradeBadge grade={getHealthGrade(client.lifecycle)} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {client.hardwareAssetCount}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {formatDate(client.updatedAt)}
                    </td>
                  </tr>
                ))}
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {search ? 'No clients match your search.' : 'No clients found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* CLIENT LIST -- Mobile */}
          <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
            {filteredClients.map(client => (
              <div
                key={client.id}
                onClick={() => router.push(`/cbr/${client.id}`)}
                className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <HealthGradeBadge grade={getHealthGrade(client.lifecycle)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {client.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {client.hardwareAssetCount} devices &middot; {client.contactCount} contacts
                  </p>
                </div>
                <span className="text-xs text-gray-400">{formatDate(client.updatedAt)}</span>
              </div>
            ))}
            {filteredClients.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                {search ? 'No clients match your search.' : 'No clients found.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
