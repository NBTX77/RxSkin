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
}

export interface WorkloadSummary {
  activeTechs: number
  avgUtilization: number
  overbookedCount: number
  availableCount: number
}
