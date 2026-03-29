'use client'

import { RefreshCw } from 'lucide-react'

interface OpsHeaderProps {
  title?: string
  subtitle?: string
  lastSync?: string
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function OpsHeader({ subtitle, lastSync, onRefresh, isRefreshing }: OpsHeaderProps) {
  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Unknown'
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        {subtitle && (
          <p className="text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {/* Live status pill */}
        <span className="flex items-center gap-2 text-xs text-green-400">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Connected
        </span>
        {/* Last sync */}
        {lastSync && (
          <span className="text-xs text-gray-500">
            Last sync: {formatTime(lastSync)}
          </span>
        )}
        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh data"
            aria-busy={isRefreshing}
            className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-800 rounded-lg text-sm transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-none"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        )}
      </div>
    </div>
  )
}
