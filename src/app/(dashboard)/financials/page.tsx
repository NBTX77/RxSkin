'use client'

import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { FinancialsDashboard } from '@/components/financials/FinancialsDashboard'

export default function FinancialsPage() {
  return (
    <ErrorBoundary section="Financials">
      <FinancialsDashboard />
    </ErrorBoundary>
  )
}
