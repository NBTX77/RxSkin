'use client'

// ============================================================
// DepartmentProvider — RX Skin
// Provides department context to the entire app.
// Determines which nav items, boards, and data each user sees.
// ============================================================

import { createContext, useContext, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import type { DepartmentCode, DepartmentConfig } from '@/types'
import { DEPARTMENTS } from '@/types'

interface DepartmentContextValue {
  /** Current active department */
  department: DepartmentCode
  /** Full config for current department */
  config: DepartmentConfig
  /** Whether user can switch departments (ADMIN or LT) */
  canSwitch: boolean
  /** Switch to a different department view */
  switchDepartment: (dept: DepartmentCode) => void
  /** All available departments */
  allDepartments: DepartmentConfig[]
  /** Whether current department is LT (sees everything) */
  isLeadership: boolean
  /** Get the CW board names this department should see */
  visibleBoards: string[]
}

const DepartmentContext = createContext<DepartmentContextValue | null>(null)

export function DepartmentProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const userDept = session?.user?.department || 'IT'
  const userRole = session?.user?.role || 'TECHNICIAN'

  const [activeDept, setActiveDept] = useState<DepartmentCode>(userDept)

  const canSwitch = userRole === 'ADMIN' || userDept === 'LT'

  const switchDepartment = useCallback((dept: DepartmentCode) => {
    if (canSwitch) setActiveDept(dept)
  }, [canSwitch])

  const config = DEPARTMENTS[activeDept]
  const isLeadership = activeDept === 'LT'

  // LT sees all boards, others see only their department's boards
  const visibleBoards = isLeadership
    ? Object.values(DEPARTMENTS).flatMap(d => d.cwBoards)
    : config.cwBoards

  const value: DepartmentContextValue = {
    department: activeDept,
    config,
    canSwitch,
    switchDepartment,
    allDepartments: Object.values(DEPARTMENTS),
    isLeadership,
    visibleBoards,
  }

  return (
    <DepartmentContext.Provider value={value}>
      {children}
    </DepartmentContext.Provider>
  )
}

export function useDepartment(): DepartmentContextValue {
  const ctx = useContext(DepartmentContext)
  if (!ctx) throw new Error('useDepartment must be used within DepartmentProvider')
  return ctx
}