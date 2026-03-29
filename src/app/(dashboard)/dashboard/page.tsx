import { DashboardRouter } from '@/components/dashboard/DashboardRouter'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export const metadata = { title: 'Dashboard — RX Skin' }

export default function DashboardPage() {
  return (
    <ErrorBoundary section="Dashboard">
      <DashboardRouter />
    </ErrorBoundary>
  )
}
