'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useFleetData } from '@/hooks/useFleetData'
import { useVehicleTrails } from '@/hooks/useVehicleTrails'
import { OpsHeader } from '@/components/ops/OpsHeader'
import { TechSidebar } from '@/components/ops/TechSidebar'
import { TechProfilePanel } from '@/components/ops/TechProfilePanel'
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

export default function FleetMapPage() {
  const { data, isLoading, refetch, isFetching } = useFleetData()
  const { data: trailData } = useVehicleTrails()
  const [selectedTech, setSelectedTech] = useState<FleetTech | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)

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

        {/* Overlay: sidebar toggle button */}
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="absolute top-3 left-3 z-[1000] bg-gray-900/90 backdrop-blur text-white text-xs font-medium px-3 py-2 rounded-lg border border-gray-700/50 hover:bg-gray-800 transition-colors shadow-lg"
        >
          {showSidebar ? 'Hide Panel' : `Techs (${techs.length})`}
        </button>

        {/* Overlay: tech sidebar card */}
        {showSidebar && (
          <div className="absolute top-12 left-3 z-[1000] w-[260px] max-h-[calc(100%-60px)] bg-gray-900/95 backdrop-blur border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <TechSidebar
              techs={techs}
              selectedTechId={selectedTech?.id}
              onSelectTech={(tech) => setSelectedTech(tech)}
              overlay
            />
          </div>
        )}
      </div>

      {/* Tech Profile Panel (slide-out — stays as-is) */}
      <TechProfilePanel
        tech={selectedTech}
        onClose={() => setSelectedTech(null)}
      />
    </div>
  )
}
