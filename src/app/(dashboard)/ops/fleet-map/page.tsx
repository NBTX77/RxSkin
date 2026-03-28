'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useFleetData } from '@/hooks/useFleetData'
import { useVehicleTrails } from '@/hooks/useVehicleTrails'
import { useDraggable } from '@/hooks/useDraggable'
import { OpsHeader } from '@/components/ops/OpsHeader'
import { TechSidebar } from '@/components/ops/TechSidebar'
import { TechProfilePanel } from '@/components/ops/TechProfilePanel'
import { GripVertical, Users, X } from 'lucide-react'
import type { FleetTech } from '@/types/ops'

// Leaflet MUST be dynamically imported — no SSR
const FleetMap = dynamic(() => import('@/components/ops/FleetMap').then((mod) => ({ default: mod.FleetMap })), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-gray-900 rounded-xl flex items-center justify-center">
      <div className="text-gray-400 text-sm">Loading map...</div>
    </div>
  ),
})

function DraggableTechCard({ techs, selectedTech, onSelectTech }: {
  techs: FleetTech[]
  selectedTech: FleetTech | null
  onSelectTech: (tech: FleetTech) => void
}) {
  const [open, setOpen] = useState(true)
  const { position, isDragging, onDragStart } = useDraggable({
    storageKey: 'rx-fleet-sidebar-pos',
    defaultPosition: { x: 12, y: 56 },
  })

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="absolute top-3 left-3 z-[1000] bg-gray-900/90 backdrop-blur-xl text-white text-xs font-medium px-3 py-2 rounded-lg border border-gray-700/40 hover:bg-gray-800 transition-colors shadow-lg flex items-center gap-1.5"
      >
        <Users size={13} />
        Techs ({techs.length})
      </button>
    )
  }

  return (
    <div
      style={{ left: position.x, top: position.y, cursor: isDragging ? 'grabbing' : undefined }}
      className={`absolute z-[1000] w-[260px] max-h-[calc(100%-24px)] bg-gray-900/95 backdrop-blur-xl border border-gray-700/40 rounded-xl shadow-2xl overflow-hidden flex flex-col ${isDragging ? 'select-none' : ''}`}
    >
      {/* Drag handle header */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-700/30 flex-shrink-0">
        <div
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          className="flex items-center justify-center w-5 h-5 rounded cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 transition-colors"
          title="Drag to reposition"
        >
          <GripVertical size={12} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-white">Technicians</span>
          <span className="text-[10px] text-gray-500 ml-1.5">({techs.length})</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="flex items-center justify-center w-5 h-5 rounded text-gray-500 hover:text-white hover:bg-gray-800/50 transition-colors"
          title="Hide panel"
        >
          <X size={12} />
        </button>
      </div>

      {/* Content */}
      <TechSidebar
        techs={techs}
        selectedTechId={selectedTech?.id}
        onSelectTech={onSelectTech}
        overlay
      />
    </div>
  )
}

export default function FleetMapPage() {
  const { data, isLoading, refetch, isFetching } = useFleetData()
  const { data: trailData } = useVehicleTrails()
  const [selectedTech, setSelectedTech] = useState<FleetTech | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <OpsHeader title="Fleet Map" subtitle="Real-time vehicle tracking" />
        <div className="h-[calc(100vh-140px)] bg-gray-900 rounded-xl animate-pulse" />
      </div>
    )
  }

  const techs = data?.techs ?? []

  return (
    <div className="space-y-2">
      <OpsHeader
        title="Fleet Map"
        subtitle={`${techs.length} technician${techs.length !== 1 ? 's' : ''} in the field`}
        lastSync={data?.lastSync}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      {/* Full-width map with overlay panels */}
      <div className="relative h-[calc(100vh-140px)] rounded-xl border border-gray-800 shadow-sm overflow-hidden">
        {/* Map takes 100% of the space */}
        <FleetMap
          techs={techs}
          trails={trailData?.trails}
          onSelectTech={(tech) => setSelectedTech(tech)}
        />

        {/* Draggable tech sidebar card */}
        <DraggableTechCard
          techs={techs}
          selectedTech={selectedTech}
          onSelectTech={(tech) => setSelectedTech(tech)}
        />
      </div>

      {/* Tech Profile Panel — now floating card style */}
      <TechProfilePanel
        tech={selectedTech}
        onClose={() => setSelectedTech(null)}
      />
    </div>
  )
}
