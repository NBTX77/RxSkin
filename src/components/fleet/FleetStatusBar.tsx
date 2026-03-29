'use client'

import { RefreshCw, AlertTriangle, Radio } from 'lucide-react'
import type { FleetTech } from '@/types/ops'

interface FleetStatusBarProps {
  techs: FleetTech[]
  lastSync: string | undefined
  isRefreshing: boolean
  onRefresh: () => void
}

function formatSyncTime(iso: string | undefined): string {
  if (!iso) return 'Never'
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return 'Unknown'
  }
}

/**
 * Detect if the fleet data is from mock/sample data.
 * Mock techs use IDs like "driver-1", "driver-2", etc.
 */
function isSampleData(techs: FleetTech[]): boolean {
  if (techs.length === 0) return false
  return techs.every((t) => t.id.startsWith('driver-'))
}

export function FleetStatusBar({ techs, lastSync, isRefreshing, onRefresh }: FleetStatusBarProps) {
  const onlineTechs = techs.filter((t) => t.lat !== 0 || t.lng !== 0)
  const showSampleWarning = isSampleData(techs)

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-2">
      {/* Sample data warning banner */}
      {showSampleWarning && (
        <div className="rounded-lg backdrop-blur-xl bg-yellow-50/90 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700/50 shadow-lg px-3 py-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
          <span className="text-xs text-yellow-800 dark:text-yellow-300">
            Samsara not configured — showing sample data.{' '}
            <a
              href="/admin/integrations"
              className="underline font-medium hover:text-yellow-900 dark:hover:text-yellow-200"
            >
              Configure
            </a>
          </span>
        </div>
      )}

      {/* Status pill */}
      <div className="rounded-full backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700/50 shadow-lg px-3 py-1.5 flex items-center gap-2.5">
        {/* Pulse dot */}
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </span>

        <span className="text-xs font-medium text-gray-900 dark:text-white">
          {onlineTechs.length} tech{onlineTechs.length !== 1 ? 's' : ''} online
        </span>

        <span className="text-gray-300 dark:text-gray-600">|</span>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Radio className="h-3 w-3" />
          {formatSyncTime(lastSync)}
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          title="Refresh fleet data"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  )
}
