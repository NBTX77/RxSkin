import dynamic from 'next/dynamic'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import '@/components/schedule/calendar-theme.css'

const ScheduleCalendar = dynamic(
  () => import('@/components/schedule/ScheduleCalendar').then(mod => ({ default: mod.ScheduleCalendar })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
)

export const metadata = { title: 'Schedule — RX Skin' }

export default function SchedulePage() {
  return (
    <ErrorBoundary section="Schedule">
      <ScheduleCalendar />
    </ErrorBoundary>
  )
}
