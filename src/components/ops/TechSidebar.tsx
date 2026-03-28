'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronUp, ChevronDown } from 'lucide-react'
import type { FleetTech, TechFilter } from '@/types/ops'
import { TechCard } from './TechCard'
import { EntryTypeFilter } from './EntryTypeFilter'

interface TechSidebarProps {
  techs: FleetTech[]
  selectedTechId?: string
  onSelectTech: (tech: FleetTech) => void
}

export function TechSidebar({ techs, selectedTechId, onSelectTech }: TechSidebarProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<TechFilter>('all')
  const [mobileExpanded, setMobileExpanded] = useState(false)

  const filteredTechs = useMemo(() => {
    let result = techs

    // Search filter
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.truckName.toLowerCase().includes(term) ||
          t.currentTicket?.summary.toLowerCase().includes(term)
      )
    }

    // Type filter
    switch (filter) {
      case 'critical':
        result = result.filter((t) =>
          t.currentTicket?.priority === 'Critical' || t.currentTicket?.priority === 'Priority 1 - Critical'
        )
        break
      case 'high':
        result = result.filter((t) =>
          t.currentTicket?.priority === 'High' || t.currentTicket?.priority === 'Priority 2 - High'
        )
        break
      case 'inProgress':
        result = result.filter((t) =>
          t.dispatch.some((d) => d.status === 'In Progress')
        )
        break
      case 'multiTech':
        result = result.filter((t) => t.scheduledHold.length > 0)
        break
      case 'lowHos':
        result = result.filter((t) => t.hosColor === 'red' || t.hosColor === 'yellow')
        break
    }

    return result
  }, [techs, search, filter])
  // Compute counts for filter pills
  const counts = useMemo(() => ({
    all: techs.length,
    critical: techs.filter((t) => t.currentTicket?.priority === 'Critical' || t.currentTicket?.priority === 'Priority 1 - Critical').length,
    high: techs.filter((t) => t.currentTicket?.priority === 'High' || t.currentTicket?.priority === 'Priority 2 - High').length,
    inProgress: techs.filter((t) => t.dispatch.some((d) => d.status === 'In Progress')).length,
    multiTech: techs.filter((t) => t.scheduledHold.length > 0).length,
    lowHos: techs.filter((t) => t.hosColor === 'red' || t.hosColor === 'yellow').length,
  }), [techs])

  // Quick stats
  const dispatched = techs.filter((t) => t.dispatch.some((d) => d.status === 'In Progress')).length
  const lowHos = techs.filter((t) => t.hosColor === 'red' || t.hosColor === 'yellow').length

  const content = (
    <>
      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search techs..."
          className="w-full pl-9 pr-3 py-2 bg-gray-800/60 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="text-center py-1.5 bg-gray-800/50 rounded-lg">
          <div className="text-xs font-bold text-white">{techs.length}</div>
          <div className="text-[10px] text-gray-500">Field</div>
        </div>
        <div className="text-center py-1.5 bg-gray-800/50 rounded-lg">
          <div className="text-xs font-bold text-blue-400">{dispatched}</div>
          <div className="text-[10px] text-gray-500">Active</div>
        </div>
        <div className="text-center py-1.5 bg-gray-800/50 rounded-lg">
          <div className={`text-xs font-bold ${lowHos > 0 ? 'text-red-400' : 'text-green-400'}`}>{lowHos}</div>
          <div className="text-[10px] text-gray-500">Low HOS</div>
        </div>
        <div className="text-center py-1.5 bg-gray-800/50 rounded-lg">
          <div className="text-xs font-bold text-yellow-400">{techs.reduce((sum, t) => sum + t.scheduledHold.length, 0)}</div>
          <div className="text-[10px] text-gray-500">Holds</div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="mb-3">
        <EntryTypeFilter activeFilter={filter} onFilterChange={setFilter} counts={counts} />
      </div>

      {/* Tech cards */}
      <div className="space-y-2 overflow-y-auto flex-1">
        {filteredTechs.map((tech) => (
          <TechCard
            key={tech.id}
            tech={tech}
            onClick={() => onSelectTech(tech)}
            isSelected={selectedTechId === tech.id}
          />
        ))}
        {filteredTechs.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            No techs match filter
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-[280px] flex-shrink-0 bg-gray-900 border-r border-gray-800 p-3 overflow-hidden">
        {content}
      </div>

      {/* Mobile bottom sheet */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40">
        <button
          onClick={() => setMobileExpanded(!mobileExpanded)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-900 border-t border-gray-800"
        >
          <span className="text-sm font-medium text-white">
            Technicians ({techs.length})
          </span>
          {mobileExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
        </button>
        {mobileExpanded && (
          <div className="bg-gray-900 border-t border-gray-800 p-3 max-h-[60vh] overflow-y-auto">
            {content}
          </div>
        )}
      </div>
    </>
  )
}