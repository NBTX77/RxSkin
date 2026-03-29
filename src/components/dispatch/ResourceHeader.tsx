'use client'

// ============================================================
// ResourceHeader — RX Skin Dispatch Board
// Custom resource label showing tech name, initials avatar,
// hours scheduled, and capacity bar.
// ============================================================

import type { Member } from '@/types'

interface ResourceHeaderProps {
  member: Member
  hoursScheduled: number
  capacity: number // typically 8
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function getCapacityColor(hours: number, capacity: number): {
  bar: string
  text: string
  bg: string
} {
  const ratio = hours / capacity
  if (ratio > 1) return { bar: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' }
  if (ratio >= 0.75) return { bar: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10' }
  return { bar: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-500/10' }
}

export function ResourceHeader({ member, hoursScheduled, capacity }: ResourceHeaderProps) {
  const initials = getInitials(member.name)
  const colors = getCapacityColor(hoursScheduled, capacity)
  const pct = Math.min((hoursScheduled / capacity) * 100, 100)

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 min-w-0">
      {/* Avatar circle */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
        <span className="text-[10px] font-bold text-white">{initials}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
          {member.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${colors.bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`text-[10px] tabular-nums font-medium ${colors.text} whitespace-nowrap`}>
            {hoursScheduled.toFixed(1)}/{capacity}h
          </span>
        </div>
      </div>
    </div>
  )
}
