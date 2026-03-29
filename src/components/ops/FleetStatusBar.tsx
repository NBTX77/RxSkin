'use client'

import { RefreshCw, Users } from 'lucide-react'

interface FleetStatusBarProps {
  techCount: number
  lastSync?: string
  onRefresh: () => void
  isRefreshing: boolean
}

export function FleetStatusBar({ techCount, lastSync, onRefresh, isRefreshing }: FleetStatusBarProps) {
  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Unknown'
    }
  }

  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200/50 dark:border-gray-700/30">
      {/* Live pulse dot */}
      <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Live
      </span>

      {/* Tech count */}
      <span className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
        <Users size={12} />
        {techCount}
      </span>

      {/* Last sync */}
      {lastSync && (
        <span className="text-xs text-gray-500">
          {formatTime(lastSync)}
        </span>
      )}

      {/* Refresh button */}
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        aria-label="Refresh fleet data"
        aria-busy={isRefreshing}
        className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-gray-700/60 rounded-md transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-none"
      >
        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
      </button>
    </div>
  )
}
