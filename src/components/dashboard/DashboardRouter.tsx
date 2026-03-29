'use client'

// ============================================================
// DashboardRouter — RX Skin
// Routes to the correct dashboard based on the user's active
// department. LT gets ExecutiveDashboard, all others get MyDayClient.
// ============================================================

import { useDepartment } from '@/components/department/DepartmentProvider'
import { ExecutiveDashboard } from '@/components/dashboard/ExecutiveDashboard'
import { MyDayClient } from '@/components/dashboard/MyDayClient'

export function DashboardRouter() {
  const { department } = useDepartment()

  if (department === 'LT') {
    return <ExecutiveDashboard />
  }

  return <MyDayClient />
}
