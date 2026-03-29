import { TicketDetail } from '@/components/tickets/TicketDetail'

export const metadata = { title: 'Ticket Detail — RX Skin' }

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const ticketId = parseInt(params.id, 10)

  return <TicketDetail ticketId={ticketId} />
}
