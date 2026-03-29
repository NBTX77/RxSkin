'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronUp, Users, AlertTriangle, Ticket, Clock } from 'lucide-react'
import type { FleetTech } from '@/types/ops'

type FilterPill = 'all' | 'lowHos' | 'onTicket' | 'idle'

interface FleetTechListProps {
  techs: FleetTech[]
  selectedTechId: string | null
  onSelectTech: (tech: FleetTech) => void
}

function hosBarColor(hosColor: FleetTech['hosColor']): string {
  switch (hosColor) {
    case 'green': return 'bg-green-500'
    case 'yellow': return 'bg-yellow-500'
    case 'red': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const FILTER_PILLS: { key: FilterPill; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'All', icon: Users },
  { key: 'lowHos', label: 'Low HOS', icon: AlertTriangle },
  { key: 'onTicket', label: 'On Ticket', icon: Ticket },
  { key: 'idle', label: 'Idle', icon: Clock },
]

export function FleetTechList({ techs, selectedTechId, onSelectTech }: FleetTechListProps) {
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterPill>('all')

  const filteredTechs = useMemo(() => {
    let result = techs

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.truckName.toLowerCase().includes(q) ||
          t.currentTicket?.summary.toLowerCase().includes(q)
      )
    }

    switch (filter) {
      case 'lowHos':
        result = result.filter((t) => t.hosColor === 'red' || t.hosColor === 'yellow')
        break
      case 'onTicket':
        result = result.filter((t) => !!t.currentTicket)
        break
      case 'idle':
        result = result.filter((t) => t.speed < 2 && !t.currentTicket)
        break
    }

    return result
  }, [techs, search, filter])

  const onlineTechs = techs.filter((t) => t.lat !== 0 || t.lng !== 0)

  return (
    <div className="absolute top-3 left-3 z-[1000] w-72 sm:w-80 max-h-[calc(100vh-7rem)]">
      {/* Collapsed: search bar + toggle */}
      <div className="rounded-xl backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700/50 shadow-lg overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Technicians</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
              {onlineTechs.length}
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-gray-200 dark:border-gray-700/50">
            {/* Search */}
            <div className="px-3 py-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search techs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filter pills */}
            <div className="px-3 pb-2 flex gap-1 flex-wrap">
              {FILTER_PILLS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === key
                      ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tech list */}
            <div className="max-h-[50vh] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
              {filteredTechs.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-gray-500">
                  No technicians match filters
                </div>
              ) : (
                filteredTechs.map((tech) => (
                  <button
                    key={tech.id}
                    onClick={() => onSelectTech(tech)}
                    className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      selectedTechId === tech.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {tech.name}
                      </span>
                      <span className="text-xs text-gray-500 ml-2 shrink-0">{tech.truckName}</span>
                    </div>

                    {/* HOS bar */}
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${hosBarColor(tech.hosColor)} transition-all`}
                          style={{ width: `${Math.min(100, Math.max(0, tech.hosPct))}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">{tech.hosRemaining}</span>
                    </div>

                    {/* Current ticket */}
                    {tech.currentTicket && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        #{tech.currentTicket.id} {tech.currentTicket.summary}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
