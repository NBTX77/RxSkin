import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { TeamWorkload } from '@/components/team/TeamWorkload'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Team Workload — RX Skin' }

export default function TeamPage() {
  return (
    <ErrorBoundary section="Team Workload">
      <TeamWorkload />
    </ErrorBoundary>
  )
}
