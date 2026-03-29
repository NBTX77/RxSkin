'use client'

import { createContext, useContext, useRef, useCallback, useEffect, useState, type ReactNode } from 'react'
import type { M365Presence } from '@/types/m365'

// ── Presence Batch Context ─────────────────────────────────
// Collects multiple presence requests and batches them into a single API call.
// All PresenceIndicator instances on the same page share this context.

interface PresenceBatchContextValue {
  getPresence: (userId: string) => M365Presence | undefined
  requestPresence: (userId: string) => void
}

const PresenceBatchContext = createContext<PresenceBatchContextValue | null>(null)

export function PresenceBatchProvider({ children }: { children: ReactNode }) {
  const [presenceMap, setPresenceMap] = useState<Record<string, M365Presence>>({})
  const pendingIds = useRef<Set<string>>(new Set())
  const batchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fetchedIds = useRef<Set<string>>(new Set())

  const flushBatch = useCallback(async () => {
    const ids = Array.from(pendingIds.current).filter(id => !fetchedIds.current.has(id))
    pendingIds.current.clear()
    if (ids.length === 0) return

    try {
      const res = await fetch('/api/m365/teams/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: ids }),
      })
      if (!res.ok) return

      const data = await res.json()
      const presences = (data.presences ?? []) as M365Presence[]

      const newMap: Record<string, M365Presence> = {}
      for (const p of presences) {
        newMap[p.id] = p
        fetchedIds.current.add(p.id)
      }
      setPresenceMap(prev => ({ ...prev, ...newMap }))
    } catch {
      // Silently fail — presence is non-critical
    }
  }, [])

  const requestPresence = useCallback((userId: string) => {
    if (fetchedIds.current.has(userId)) return
    pendingIds.current.add(userId)

    // Debounce: wait 100ms to collect all requests, then fire one batch
    if (batchTimer.current) clearTimeout(batchTimer.current)
    batchTimer.current = setTimeout(flushBatch, 100)
  }, [flushBatch])

  const getPresence = useCallback((userId: string) => {
    return presenceMap[userId]
  }, [presenceMap])

  // Refresh presence every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchedIds.current.clear()
      // Re-request all known IDs
      for (const id of Object.keys(presenceMap)) {
        pendingIds.current.add(id)
      }
      flushBatch()
    }, 60000)
    return () => clearInterval(interval)
  }, [presenceMap, flushBatch])

  return (
    <PresenceBatchContext.Provider value={{ getPresence, requestPresence }}>
      {children}
    </PresenceBatchContext.Provider>
  )
}

// ── Presence Indicator Component ───────────────────────────

const AVAILABILITY_COLORS: Record<string, string> = {
  Available: 'bg-green-500',
  Busy: 'bg-red-500',
  DoNotDisturb: 'bg-red-500',
  Away: 'bg-yellow-500',
  BeRightBack: 'bg-yellow-500',
  Offline: 'bg-gray-400',
  PresenceUnknown: 'bg-gray-400',
}

const AVAILABILITY_LABELS: Record<string, string> = {
  Available: 'Available',
  Busy: 'Busy',
  DoNotDisturb: 'Do Not Disturb',
  Away: 'Away',
  BeRightBack: 'Be Right Back',
  Offline: 'Offline',
  PresenceUnknown: 'Unknown',
}

const SIZE_CLASSES = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
} as const

interface PresenceIndicatorProps {
  userId: string
  size?: 'sm' | 'md' | 'lg'
}

export function PresenceIndicator({ userId, size = 'md' }: PresenceIndicatorProps) {
  const ctx = useContext(PresenceBatchContext)

  useEffect(() => {
    ctx?.requestPresence(userId)
  }, [ctx, userId])

  const presence = ctx?.getPresence(userId)
  if (!presence) return null

  const colorClass = AVAILABILITY_COLORS[presence.availability] ?? 'bg-gray-400'
  const label = AVAILABILITY_LABELS[presence.availability] ?? presence.availability
  const sizeClass = SIZE_CLASSES[size]

  return (
    <span
      className={`inline-block rounded-full ${sizeClass} ${colorClass} ring-2 ring-white dark:ring-gray-900`}
      title={label}
    />
  )
}
