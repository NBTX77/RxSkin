'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useFleetData } from '@/hooks/useFleetData'
import { FleetStatusBar } from '@/components/ops/FleetStatusBar'
import { TechSidebar } from '@/components/ops/TechSidebar'
import { TechProfilePanel } from '@/components/ops/TechProfilePanel'
import type { FleetTech } from '@/types/ops'

// Leaflet MUST be dynamically imported — no SSR
const FleetMap = dynamic(() => import('@/components/ops/FleetMap').then((mod) => ({ default: mod.FleetMap })), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-gray-500 text-sm">Loading map...</div>
    </div>
  ),
})

export default function FleetMapPage() {
  const { data, isLoading, refetch, isFetching } = useFleetData()
  const [selectedTech, setSelectedTech] = useState<FleetTech | null>(null)

  if (isLoading) {
    return (
      <div className="-m-4 lg:-m-6 h-[calc(100vh-3.5rem)] flex flex-col">
        <div className="relative flex-1 bg-gray-100 dark:bg-gray-950 animate-pulse" />
      </div>
    )
  }

  const techs = data?.techs ?? []

  return (
    <div className="-m-4 lg:-m-6 h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Map fills entire area */}
      <div className="relative flex-1 h-full">
        <FleetMap
          techs={techs}
          onSelectTech={(tech) => setSelectedTech(tech)}
        />

        {/* Floating status bar — top-right */}
        <FleetStatusBar
          techCount={techs.length}
          lastSync={data?.lastSync}
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
        />

        {/* Floating tech sidebar — top-left on desktop, bottom on mobile */}
        <TechSidebar
          techs={techs}
          selectedTechId={selectedTech?.id}
          onSelectTech={(tech) => setSelectedTech(tech)}
        />

        {/* Tech Profile Panel (slide-out) continues to overlay from right */}
        <TechProfilePanel
          tech={selectedTech}
          onClose={() => setSelectedTech(null)}
        />
      </div>
    </div>
  )
}
