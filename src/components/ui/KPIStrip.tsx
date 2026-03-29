import type { ReactNode } from 'react'

interface KPIStripProps {
  children: ReactNode
}

export function KPIStrip({ children }: KPIStripProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2">
      {children}
    </div>
  )
}
