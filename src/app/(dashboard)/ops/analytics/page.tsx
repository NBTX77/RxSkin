'use client'

import dynamic from 'next/dynamic'

const AnalyticsDashboard = dynamic(
  () => import('@/components/ops/AnalyticsDashboard').then(mod => ({ default: mod.AnalyticsDashboard })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
)

export default function AnalyticsPage() {
  return <AnalyticsDashboard />
}
