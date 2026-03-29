'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  MousePointer2,
  Flame,
  Eye,
  AlertCircle,
  Map,
  Clock,
  Users,
  Sparkles,
  ChevronRight,
} from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">
          Behavior tracking, heatmaps, and AI-powered site insights. All data feeds into the Admin Advisor bot for improvement suggestions.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={MousePointer2} label="Click Events" value="12,847" change="+8%" period="Last 7 days" color="blue" />
        <StatCard icon={Users} label="Active Users" value="34" change="+2" period="Today" color="green" />
        <StatCard icon={Clock} label="Avg Session" value="24m" change="+3m" period="Last 7 days" color="purple" />
        <StatCard icon={AlertCircle} label="Dead Zones" value="3" change="-1" period="AI detected" color="orange" />
      </div>

      {/* Tracking Configuration */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-900 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tracking Configuration</h3>
        </div>

        <div className="space-y-4">
          <ToggleRow
            label="Click tracking"
            description="Record all click events with element, position, and page context"
            enabled={true}
          />
          <ToggleRow
            label="Scroll depth tracking"
            description="Track how far users scroll on each page"
            enabled={true}
          />
          <ToggleRow
            label="Session recording"
            description="Record anonymized session replays for UX analysis"
            enabled={false}
          />
          <ToggleRow
            label="Error tracking"
            description="Capture JavaScript errors and failed API calls"
            enabled={true}
          />
          <ToggleRow
            label="Performance metrics"
            description="Track page load times, API response times, and Core Web Vitals"
            enabled={true}
          />
        </div>
      </div>

      {/* Heatmaps */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-orange-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Heatmaps</h3>
          </div>
          <select className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-700 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <HeatmapCard page="/dashboard" clicks={4521} hotspot="Quick Actions panel" coverage="78%" />
          <HeatmapCard page="/tickets" clicks={3892} hotspot="Search bar" coverage="85%" />
          <HeatmapCard page="/tickets/[id]" clicks={2103} hotspot="Notes tab" coverage="62%" />
          <HeatmapCard page="/schedule" clicks={1331} hotspot="Week view toggle" coverage="45%" />
        </div>

        <p className="text-[10px] text-gray-600">
          Heatmap data is stored locally and never leaves your instance. AI analysis runs server-side.
        </p>
      </div>

      {/* Dead Zones (AI-detected) */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-900 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Map size={16} className="text-red-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Dead Zones</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-600/15 text-cyan-400 border border-cyan-500/20">
            AI detected
          </span>
        </div>
        <p className="text-xs text-gray-500">Areas of the UI that receive little to no interaction. These are candidates for redesign or removal.</p>

        <div className="space-y-2">
          <DeadZoneRow
            page="/dashboard"
            element="Bottom-right widget area"
            lastClick="3 days ago"
            suggestion="Move quick stats to a more prominent position or collapse into expandable section"
          />
          <DeadZoneRow
            page="/tickets"
            element="Board filter dropdown"
            lastClick="5 days ago"
            suggestion="Users prefer the search bar over filters — consider auto-suggest with board names in search"
          />
          <DeadZoneRow
            page="/settings"
            element="ConnectWise Connection card"
            lastClick="12 days ago"
            suggestion="This is informational-only — move to Admin Panel where it's more relevant"
          />
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-900 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">AI Improvement Suggestions</h3>
        </div>
        <p className="text-xs text-gray-500">
          Based on click patterns, session data, and heatmaps. Review and approve changes before implementation.
        </p>

        <div className="space-y-2">
          <SuggestionRow
            title="Reorder ticket list columns"
            description="73% of users click Status and Priority first. Move these columns left of Company."
            impact="Medium"
            status="pending"
          />
          <SuggestionRow
            title="Add keyboard shortcut hints"
            description="Only 12% of users use Ctrl+K search. Show a tooltip on first visit."
            impact="Low"
            status="pending"
          />
          <SuggestionRow
            title="Enlarge mobile touch targets"
            description="Ticket action buttons have a 38% miss rate on mobile. Increase tap area to 44px."
            impact="High"
            status="approved"
          />
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  change,
  period,
  color,
}: {
  icon: LucideIcon
  label: string
  value: string
  change: string
  period: string
  color: string
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-600/15',
    green: 'text-green-400 bg-green-600/15',
    purple: 'text-purple-400 bg-purple-600/15',
    orange: 'text-orange-400 bg-orange-600/15',
  }
  const c = colorMap[color]

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-900 p-4">
      <div className={`w-8 h-8 rounded-lg ${c} flex items-center justify-center mb-2`}>
        <Icon size={16} />
      </div>
      <p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-[10px] text-green-400 mt-1">{change} — {period}</p>
    </div>
  )
}

function HeatmapCard({ page, clicks, hotspot, coverage }: { page: string; clicks: number; hotspot: string; coverage: string }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700/50 bg-gray-100 dark:bg-gray-800/50 p-4 hover:border-gray-600 transition-colors cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{page}</span>
        <span className="text-[10px] text-gray-500">{clicks.toLocaleString()} clicks</span>
      </div>
      <p className="text-xs text-gray-500">Hotspot: <span className="text-gray-700 dark:text-gray-300">{hotspot}</span></p>
      <div className="mt-2 w-full bg-gray-700 rounded-full h-1.5">
        <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: coverage }} />
      </div>
      <p className="text-[10px] text-gray-600 mt-1">{coverage} page coverage</p>
    </div>
  )
}

function DeadZoneRow({ page, element, lastClick, suggestion }: { page: string; element: string; lastClick: string; suggestion: string }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700/50 bg-gray-800/30 p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-mono text-gray-500">{page}</span>
        <ChevronRight size={10} className="text-gray-600" />
        <span className="text-xs text-gray-700 dark:text-gray-300">{element}</span>
      </div>
      <p className="text-[10px] text-gray-600 mb-1.5">Last click: {lastClick}</p>
      <p className="text-xs text-cyan-400/80 italic">&ldquo;{suggestion}&rdquo;</p>
    </div>
  )
}

function SuggestionRow({
  title,
  description,
  impact,
  status,
}: {
  title: string
  description: string
  impact: string
  status: 'pending' | 'approved' | 'rejected' | 'implemented'
}) {
  const impactColors: Record<string, string> = {
    Low: 'text-gray-600 dark:text-gray-400 bg-gray-600/20',
    Medium: 'text-yellow-400 bg-yellow-600/20',
    High: 'text-orange-400 bg-orange-600/20',
  }
  const statusColors: Record<string, string> = {
    pending: 'text-gray-600 dark:text-gray-400 bg-gray-600/20',
    approved: 'text-green-400 bg-green-600/20',
    rejected: 'text-red-400 bg-red-600/20',
    implemented: 'text-blue-400 bg-blue-600/20',
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700/50 bg-gray-800/30 p-4 flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm text-gray-900 dark:text-white font-medium">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-[10px] px-2 py-0.5 rounded ${impactColors[impact]}`}>{impact}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded capitalize ${statusColors[status]}`}>{status}</span>
        {status === 'pending' && (
          <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Approve
          </button>
        )}
      </div>
    </div>
  )
}

function ToggleRow({ label, description, enabled: defaultEnabled }: { label: string; description: string; enabled: boolean }) {
  const [enabled, setEnabled] = useState(defaultEnabled)

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-gray-700 dark:text-gray-300">{label}</p>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
          enabled ? 'bg-blue-600' : 'bg-gray-700'
        }`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          enabled ? 'left-5' : 'left-0.5'
        }`} />
      </button>
    </div>
  )
}
