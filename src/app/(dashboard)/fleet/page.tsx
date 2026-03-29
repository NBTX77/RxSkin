'use client'

import dynamic from 'next/dynamic'

const FleetMapView = dynamic(
  () => import('@/components/fleet/FleetMapView').then(mod => ({ default: mod.FleetMapView })),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950"><div className="text-gray-500">Loading map...</div></div> }
)

export default function FleetPage() {
  return <FleetMapView />
}
