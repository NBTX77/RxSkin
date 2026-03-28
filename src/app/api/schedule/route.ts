// GET /api/schedule — List schedule entries

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getCWCredentials } from '@/lib/cw/credentials'
import { getScheduleEntries } from '@/lib/cw/client'
import { getMockScheduleEntries } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

function computeDateRange(date: string, view: string): { start: string; end: string } {
  const d = new Date(date + 'T00:00:00')
  if (view === 'day') {
    return { start: date, end: date }
  }
  if (view === 'month') {
    const first = new Date(d.getFullYear(), d.getMonth(), 1)
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    return {
      start: first.toISOString().split('T')[0],
      end: last.toISOString().split('T')[0],
    }
  }
  // week (default) — Monday to Friday
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  return {
    start: monday.toISOString().split('T')[0],
    end: friday.toISOString().split('T')[0],
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { searchParams } = new URL(req.url)
    let start = searchParams.get('start')
    let end = searchParams.get('end')

    // Support date + view shorthand (used by schedule page)
    if (!start || !end) {
      const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
      const view = searchParams.get('view') || 'week'
      const range = computeDateRange(date, view)
      start = range.start
      end = range.end
    }

    const creds = getCWCredentials()
    if (creds) {
      const memberId = searchParams.get('memberId')
      const entries = await getScheduleEntries(creds, {
        start,
        end,
        memberId: memberId ? parseInt(memberId, 10) : undefined,
      })
      return Response.json(entries)
    } else {
      const entries = getMockScheduleEntries()
      return Response.json(entries)
    }
  } catch (error) {
    return handleApiError(error)
  }
}
