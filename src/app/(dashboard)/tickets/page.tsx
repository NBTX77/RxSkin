import { Suspense } from 'react'
import { TicketListClient } from '@/components/tickets/TicketListClient'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export const metadata = { title: 'Tickets — RX Skin' }

export default function TicketsPage() {
  return (
    <ErrorBoundary section="Ticket List">
      <Suspense fallback={<TicketListSkeleton />}>
        <TicketListClient />
      </Suspense>
    </ErrorBoundary>
  )
}

function TicketListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-16 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
      ))}
    </div>
  )
}
