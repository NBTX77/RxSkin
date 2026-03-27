// GET /api/schedule — List schedule entries

import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getMockScheduleEntries } from '@/lib/mock-data'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    // TODO: Replace with real CW API call when credentials configured
    const entries = getMockScheduleEntries()
    return Response.json(entries)
  } catch (error) {
    return handleApiError(error)
  }
}