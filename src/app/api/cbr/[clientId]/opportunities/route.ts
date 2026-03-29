// GET /api/cbr/[clientId]/opportunities — Opportunities for a client

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getScalePadCredentials, getClientOpportunities } from '@/lib/scalepad/client'
import { apiErrors, handleApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { clientId } = await params
    if (!clientId) return apiErrors.badRequest('clientId is required')

    const creds = getScalePadCredentials()
    const opportunities = await getClientOpportunities(creds, clientId)

    return Response.json({ opportunities })
  } catch (error) {
    return handleApiError(error)
  }
}
