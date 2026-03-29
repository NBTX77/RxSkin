'use client'

export const dynamic = 'force-dynamic'

import { CBRDashboard } from '@/components/cbr/CBRDashboard'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export default function CBRPage() {
  return (
    <ErrorBoundary>
      <CBRDashboard />
    </ErrorBoundary>
  )
}
