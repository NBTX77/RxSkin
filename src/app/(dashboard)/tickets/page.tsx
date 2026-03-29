import { Suspense } from 'react'
import { TicketListClient } from '@/components/tickets/TicketListClient'

export const metadata = { title: 'Tickets — RX Skin' }

export default function TicketsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Tickets</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
          + New Ticket
        </button>
      </div>

      <Suspense fallback={<TicketListSkeleton />}>
        <TicketListClient />
      </Suspense>
    </div>
  )
}

function TicketListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-16 rounded-lg bg-gray-800 animate-pulse" />
      ))}
    </div>
  )
}
