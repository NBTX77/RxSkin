'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { TopBar } from '@/components/layout/TopBar'
import { GlobalSearch } from '@/components/layout/GlobalSearch'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Desktop sidebar */}
      <ErrorBoundary section="Sidebar">
        <Sidebar />
      </ErrorBoundary>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Persistent top bar with avatar pinned to top-right */}
        <ErrorBoundary section="TopBar">
          <TopBar />
        </ErrorBoundary>

        <div className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          <ErrorBoundary section="Page Content">
            {children}
          </ErrorBoundary>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <ErrorBoundary section="MobileNav">
        <MobileNav />
      </ErrorBoundary>

      {/* Global search overlay (Ctrl+K) */}
      <ErrorBoundary section="GlobalSearch">
        <GlobalSearch />
      </ErrorBoundary>
    </div>
  )
}
