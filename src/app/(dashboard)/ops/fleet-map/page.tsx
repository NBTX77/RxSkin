'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useFleetData } from '@/hooks/useFleetData'
import { OpsHeader } from '@/components/ops/OpsHeader'
import { TechSidebar } from '@/components/ops/TechSidebar'
import { TechProfilePanel } from '@/components/ops/TechProfilePanel'
import type { FleetTech } from '@/types/ops'

// Leaflet MUST be dynamically imported — no SSR
const FleetMap = dynamic(() => import('@/components/ops/FleetMap').then((mod) => ({ default: mod.FleetMap })), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-gray-950 rounded-xl flex items-center justify-center">
      <div className="text-gray-500 text-sm">Loading map...</div>
    </div>
  ),
})

export default function FleetMapPage() {
  const { data, isLoading, refetch, isFetching } = useFleetData()
  const [selectedTech, setSelectedTech] = useState<FleetTech | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <OpsHeader title="Fleet Map" subtitle="Real-time vehicle tracking" />
        <div className="flex gap-0 h-[calc(100vh-180px)]">
          <div className="hidden lg:block w-[280px] bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
          <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  const techs = data?.techs ?? []

  return (
    <div className="space-y-4">
      <OpsHeader
        title="Fleet Map"
        subtitle={`${techs.length} technician${techs.length !== 1 ? 's' : ''} in the field`}
        lastSync={data?.lastSync}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      <div className="flex h-[calc(100vh-180px)] gap-0 overflow-hidden rounded-xl border border-gray-800">
        {/* Tech sidebar (view-specific, not the app sidebar) */}
        <TechSidebar
          techs={techs}
          selectedTechId={selectedTech?.id}
          onSelectTech={(tech) => setSelectedTech(tech)}
        />

        {/* Map */}
        <div className="flex-1 relative">
          <FleetMap
            techs={techs}
            onSelectTech={(tech) => setSelectedTech(tech)}
          />
        </div>
      </div>

      {/* Tech Profile Panel (slide-out) */}
      <TechProfilePanel
        tech={selectedTech}
        onClose={() => setSelectedTech(null)}
      />
    </div>
  )
}