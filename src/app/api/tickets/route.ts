import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

// Mock ticket data for Phase 1
const mockTickets = [
  {
    id: 1,
    ticketNumber: 'TKT-001',
    summary: 'Email server down',
    description: 'Exchange server is offline',
    company: 'Acme Corp',
    status: 'In Progress',
    priority: 'High',
    createdDate: '2026-03-24T10:30:00Z',
    updatedDate: '2026-03-26T14:15:00Z',
    assignedTo: 'John Smith',
    type: 'Hardware',
  },
  {
    id: 2,
    ticketNumber: 'TKT-002',
    summary: 'VPN connection issues',
    description: 'Remote users cannot connect to VPN',
    company: 'TechStart Inc',
    status: 'Waiting',
    priority: 'Medium',
    createdDate: '2026-03-25T09:00:00Z',
    updatedDate: '2026-03-26T11:20:00Z',
    assignedTo: 'Sarah Johnson',
    type: 'Network',
  },
  {
    id: 3,
    ticketNumber: 'TKT-003',
    summary: 'Password reset request',
    description: 'User locked out of account',
    company: 'Global Solutions',
    status: 'Resolved',
    priority: 'Low',
    createdDate: '2026-03-23T15:45:00Z',
    updatedDate: '2026-03-25T16:30:00Z',
    assignedTo: 'Mike Chen',
    type: 'Access Control',
  },
  {
    id: 4,
    ticketNumber: 'TKT-004',
    summary: 'Printer driver installation',
    description: 'New printer not printing from workstations',
    company: 'Acme Corp',
    status: 'In Progress',
    priority: 'Medium',
    createdDate: '2026-03-26T08:00:00Z',
    updatedDate: '2026-03-26T13:45:00Z',
    assignedTo: 'John Smith',
    type: 'Hardware',
  },
  {
    id: 5,
    ticketNumber: 'TKT-005',
    summary: 'Backup verification needed',
    description: 'Monthly backup verification for compliance',
    company: 'Enterprise Ltd',
    status: 'Waiting',
    priority: 'High',
    createdDate: '2026-03-20T12:00:00Z',
    updatedDate: '2026-03-26T09:30:00Z',
    assignedTo: 'Sarah Johnson',
    type: 'Backup/Disaster Recovery',
  },
]

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In Phase 1, return mock data
    // In Phase 2+, would call ConnectWise API here via BFF layer
    return NextResponse.json(mockTickets)
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validate required fields
    if (!body.summary || !body.company) {
      return NextResponse.json(
        { error: 'Missing required fields: summary, company' },
        { status: 400 }
      )
    }

    // In Phase 1, create mock ticket
    // In Phase 2+, would post to ConnectWise API here
    const newTicket = {
      id: Math.max(...mockTickets.map(t => t.id)) + 1,
      ticketNumber: `TKT-${String(Math.max(...mockTickets.map(t => t.id)) + 1).padStart(3, '0')}`,
      summary: body.summary,
      description: body.description || '',
      company: body.company,
      status: 'New',
      priority: body.priority || 'Medium',
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      assignedTo: body.assignedTo || 'Unassigned',
      type: body.type || 'General',
    }

    return NextResponse.json(newTicket, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
