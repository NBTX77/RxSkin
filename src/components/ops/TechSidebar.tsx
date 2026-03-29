'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Search, ChevronDown, ChevronUp, Users, GripVertical } from 'lucide-react'
import type { FleetTech, TechFilter } from '@/types/ops'
import { TechCard } from './TechCard'
import { EntryTypeFilter } from './EntryTypeFilter'

interface TechSidebarProps {
  techs: FleetTech[]
  selectedTechId?: string
  onSelectTech: (tech: FleetTech) => void
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)')
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return isMobile
}

export function TechSidebar({ techs, selectedTechId, onSelectTech }: TechSidebarProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<TechFilter>('all')
  const isMobile = useIsMobile()
  const [isCollapsed, setIsCollapsed] = useState(isMobile)
  const [position, setPosition] = useState({ x: 12, y: 12 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  // Sync collapsed state when breakpoint changes
  useEffect(() => {
    setIsCollapsed(isMobile)
  }, [isMobile])

  // Drag handlers (desktop only)
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isMobile) return
    e.preventDefault()
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragOffset.current = { x: clientX - position.x, y: clientY - position.y }
  }, [isMobile, position])

  useEffect(() => {
    if (!isDragging) return
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY
      setPosition({
        x: Math.max(0, clientX - dragOffset.current.x),
        y: Math.max(0, clientY - dragOffset.current.y),
      })
    }
    const handleEnd = () => setIsDragging(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleMove)
    window.addEventListener('touchend', handleEnd)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging])

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

  const headerBar = (
    <div
      className={`flex items-center justify-between px-3 py-2.5 select-none ${
        !isMobile ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''
      }`}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
    >
      <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
        {!isMobile && <GripVertical size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />}
        <Users size={15} className="text-gray-500 dark:text-gray-400" />
        Technicians ({techs.length})
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed) }}
        className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label={isCollapsed ? 'Expand technicians' : 'Collapse technicians'}
      >
        {isCollapsed ? (
          <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronUp size={16} className="text-gray-500 dark:text-gray-400" />
        )}
      </button>
    </div>
  )

  const expandedContent = (
    <div className="px-3 pb-3 flex flex-col overflow-hidden">
      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <label htmlFor="tech-search" className="sr-only">Search technicians</label>
        <input
          id="tech-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search techs..."
          className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700/50 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="text-center py-1.5 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
          <div className="text-xs font-bold text-gray-900 dark:text-white">{techs.length}</div>
          <div className="text-[10px] text-gray-500">Field</div>
        </div>
        <div className="text-center py-1.5 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
          <div className="text-xs font-bold text-blue-400">{dispatched}</div>
          <div className="text-[10px] text-gray-500">Active</div>
        </div>
        <div className="text-center py-1.5 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
          <div className={`text-xs font-bold ${lowHos > 0 ? 'text-red-400' : 'text-green-400'}`}>{lowHos}</div>
          <div className="text-[10px] text-gray-500">Low HOS</div>
        </div>
        <div className="text-center py-1.5 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
          <div className="text-xs font-bold text-yellow-400">{techs.reduce((sum, t) => sum + t.scheduledHold.length, 0)}</div>
          <div className="text-[10px] text-gray-500">Holds</div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="mb-3">
        <EntryTypeFilter activeFilter={filter} onFilterChange={setFilter} counts={counts} />
      </div>

      {/* Tech cards — scrollable */}
      <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
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
    </div>
  )

  // Desktop: floating card top-left
  // Mobile: floating card at bottom
  return (
    <>
      {/* Desktop — draggable floating card */}
      <div
        style={{ left: position.x, top: position.y }}
        className={`hidden lg:flex flex-col absolute z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/30 ${
          isDragging ? '' : 'transition-all'
        } ${isCollapsed ? 'w-auto' : 'w-[300px] max-h-[calc(100vh-6rem)]'}`}
      >
        {headerBar}
        {!isCollapsed && expandedContent}
      </div>

      {/* Mobile — bottom floating card */}
      <div
        className={`lg:hidden flex flex-col absolute left-2 right-2 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/30 transition-all ${
          isCollapsed ? 'bottom-2' : 'bottom-2 max-h-[60vh]'
        }`}
      >
        {headerBar}
        {!isCollapsed && expandedContent}
      </div>
    </>
  )
}
