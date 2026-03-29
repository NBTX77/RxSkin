import type { ScheduleEntry, DepartmentCode } from '@/types'

export interface TechWorkload {
  id: number
  name: string
  identifier: string
  department: DepartmentCode
  scheduledHours: number
  capacity: number
  entries: ScheduleEntry[]
  utilization: number // 0-100+ percentage
  csatPercent?: number | null  // CSAT score from SmileBack (0-100)
  csatReviews?: number         // number of reviews
  csatTrend?: 'up' | 'down' | 'stable'
}

export interface WorkloadSummary {
  activeTechs: number
  avgUtilization: number
  overbookedCount: number
  availableCount: number
  teamCSAT?: number | null  // average CSAT % across all techs with reviews
  teamCSATReviews?: number  // total review count across all techs
}
