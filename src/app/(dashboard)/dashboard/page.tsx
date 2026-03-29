import { MyDayClient } from '@/components/dashboard/MyDayClient'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export const metadata = { title: 'My Day — RX Skin' }

export default function DashboardPage() {
  return (
    <ErrorBoundary section="Dashboard">
      <MyDayClient />
    </ErrorBoundary>
  )
}
