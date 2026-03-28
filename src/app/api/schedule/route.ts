// GET /api/schedule — List schedule entries

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getCWCredentials } from '@/lib/cw/credentials'
import { getScheduleEntries } from '@/lib/cw/client'
import { getMockScheduleEntries } from '@/lib/mock-data'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { searchParams } = new URL(req.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    const creds = getCWCredentials()
    if (creds && start && end) {
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
