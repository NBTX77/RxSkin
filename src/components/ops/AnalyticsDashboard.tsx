'use client'

import { Ticket, Clock, AlertTriangle, Users } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { OpsHeader } from './OpsHeader'
import { KpiCard } from './KpiCard'
import { StatusDonut } from './StatusDonut'
import { PriorityDonut } from './PriorityDonut'
import { WorkloadBars } from './WorkloadBars'

export function AnalyticsDashboard() {
  const { data, isLoading, refetch, isFetching, dataUpdatedAt } = useAnalytics()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <OpsHeader title="Analytics" subtitle="Ticket analytics and team workload" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse h-80" />
          <div className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse h-80" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <OpsHeader title="Analytics" subtitle="Ticket analytics and team workload" />
        <div className="flex items-center justify-center h-64 text-gray-500">
          Failed to load analytics data
        </div>
      </div>
    )
  }

  const boardDetail = Object.entries(data.kpis.openTickets.byBoard)
    .map(([board, count]) => `${board}: ${count}`)
    .join(', ')

  return (
    <div className="space-y-4">
      <OpsHeader
        title="Analytics"
        subtitle="Ticket analytics and team workload"
        lastSync={dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : undefined}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Open Tickets"
          value={data.kpis.openTickets.total}
          icon={<Ticket size={18} />}
          color="blue"
          detail={boardDetail || undefined}
        />
        <KpiCard
          label="In Progress"
          value={data.kpis.inProgress}
          icon={<Clock size={18} />}
          color="green"
        />
        <KpiCard
          label="High / Critical"
          value={data.kpis.highCritical}
          icon={<AlertTriangle size={18} />}
          color="orange"
        />
        <KpiCard
          label="Multi-Tech"
          value={data.kpis.multiTech}
          icon={<Users size={18} />}
          color="purple"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Status Breakdown</h3>
          <StatusDonut data={data.statusBreakdown} />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Priority Distribution</h3>
          <PriorityDonut data={data.priorityBreakdown} />
        </div>
      </div>

      {/* Workload chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Tech Workload (Top 8)</h3>
        <WorkloadBars data={data.techWorkload} />
      </div>
    </div>
  )
}
