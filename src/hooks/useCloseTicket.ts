'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface CloseTicketPayload {
  resolutionNote: string
  timeEntry?: {
    hours: number
    minutes?: number
    workType?: string
    notes?: string
  }
  notifyClient?: boolean
  notificationMessage?: string
}

export interface CloseTicketResult {
  success: boolean
  ticketId: number
  actions: {
    statusUpdated: boolean
    noteAdded: boolean
    timeEntryCreated: boolean
    clientNotified: boolean
  }
  errors: string[]
}

async function closeTicket(ticketId: number, payload: CloseTicketPayload): Promise<CloseTicketResult> {
  const res = await fetch(`/api/tickets/${ticketId}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to close ticket' }))
    throw new Error(error.message ?? `Failed to close ticket (${res.status})`)
  }

  return res.json()
}

export function useCloseTicket(ticketId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CloseTicketPayload) => closeTicket(ticketId, payload),
    onSuccess: () => {
      // Invalidate all ticket-related queries
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['ticket-notes', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['ticket-time', ticketId] })
      // Also invalidate the ticket list so closed ticket status is reflected
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}
