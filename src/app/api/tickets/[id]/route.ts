import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

// Mock data — Phase 1 only. Phase 2+ will integrate ConnectWise API.
const MOCK_TICKETS: Record<
  string,
  {
    id: string
    ticketNumber: string
    summary: string
    description: string
    company: string
    status: 'New' | 'In Progress' | 'Waiting' | 'Resolved'
    priority: 'High' | 'Medium' | 'Low'
    createdAt: string
    updatedAt: string
    assignedTo: string | null
    type: string
  }
> = {
  '1': {
    id: '1',
    ticketNumber: 'TK-1001',
    summary: 'Network outage in main office',
    description: 'Internet connection down since 2pm. Affecting all staff.',
    company: 'Acme Corp',
    status: 'In Progress',
    priority: 'High',
    createdAt: '2026-03-25T14:30:00Z',
    updatedAt: '2026-03-26T09:15:00Z',
    assignedTo: 'John Smith',
    type: 'Network',
  },
  '2': {
    id: '2',
    ticketNumber: 'TK-1002',
    summary: 'Email sync issues on mobile',
    description: 'User unable to sync email on iPhone. Tried password reset.',
    company: 'TechStart Inc',
    status: 'Waiting',
    priority: 'Medium',
    createdAt: '2026-03-24T10:00:00Z',
    updatedAt: '2026-03-25T16:45:00Z',
    assignedTo: 'Jane Doe',
    type: 'Email',
  },
  '3': {
    id: '3',
    ticketNumber: 'TK-1003',
    summary: 'Printer driver installation',
    description: 'New HP printer setup. Need driver installation on 5 workstations.',
    company: 'Global Solutions',
    status: 'New',
    priority: 'Low',
    createdAt: '2026-03-26T08:20:00Z',
    updatedAt: '2026-03-26T08:20:00Z',
    assignedTo: null,
    type: 'Hardware',
  },
  '4': {
    id: '4',
    ticketNumber: 'TK-1004',
    summary: 'Password reset request',
    description: 'User forgot Active Directory password. Needs reset.',
    company: 'Acme Corp',
    status: 'Resolved',
    priority: 'High',
    createdAt: '2026-03-20T12:00:00Z',
    updatedAt: '2026-03-20T13:30:00Z',
    assignedTo: 'John Smith',
    type: 'Account',
  },
  '5': {
    id: '5',
    ticketNumber: 'TK-1005',
    summary: 'Backup verification needed',
    description: 'Monthly backup audit. Need to verify all systems backed up correctly.',
    company: 'TechStart Inc',
    status: 'In Progress',
    priority: 'Medium',
    createdAt: '2026-03-18T09:00:00Z',
    updatedAt: '2026-03-25T14:20:00Z',
    assignedTo: 'Jane Doe',
    type: 'Backup',
  },
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params
  const ticket = MOCK_TICKETS[id]

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  return NextResponse.json(ticket)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params
  const ticket = MOCK_TICKETS[id]

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  try {
    const body = await req.json()
    const { summary, description, status, priority, assignedTo } = body

    // Update mock ticket
    const updated = {
      ...ticket,
      ...(summary !== undefined && { summary }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(assignedTo !== undefined && { assignedTo }),
      updatedAt: new Date().toISOString(),
    }

    MOCK_TICKETS[id] = updated
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params
  if (!MOCK_TICKETS[id]) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  delete MOCK_TICKETS[id]
  return NextResponse.json({ success: true })
}
