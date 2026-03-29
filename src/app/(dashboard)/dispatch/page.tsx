import nextDynamic from 'next/dynamic'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import '@/components/schedule/calendar-theme.css'

export const dynamic = 'force-dynamic'

const DispatchBoard = nextDynamic(
  () => import('@/components/dispatch/DispatchBoard').then(mod => ({ default: mod.DispatchBoard })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
)

export const metadata = { title: 'Dispatch Board — RX Skin' }

export default function DispatchPage() {
  return (
    <ErrorBoundary section="Dispatch Board">
      <DispatchBoard />
    </ErrorBoundary>
  )
}
