'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { TopBar } from '@/components/layout/TopBar'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { TimeTrackerProvider } from '@/contexts/TimeTrackerContext'
import { TimerWidget } from '@/components/timer/TimerWidget'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <TimeTrackerProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
        {/* Desktop sidebar */}
        <ErrorBoundary section="Sidebar">
          <Sidebar />
        </ErrorBoundary>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-h-screen min-w-0 lg:ml-12">
          {/* Persistent top bar with avatar pinned to top-right */}
          <ErrorBoundary section="TopBar">
            <TopBar />
          </ErrorBoundary>

          <div className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 min-w-0">
            <ErrorBoundary section="Page Content">
              {children}
            </ErrorBoundary>
          </div>
        </main>

        {/* Mobile bottom nav */}
        <ErrorBoundary section="MobileNav">
          <MobileNav />
        </ErrorBoundary>

        {/* Floating timer widget */}
        <ErrorBoundary section="TimerWidget">
          <TimerWidget />
        </ErrorBoundary>
      </div>
    </TimeTrackerProvider>
  )
}
