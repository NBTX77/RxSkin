// GET /api/cbr/[clientId]/licenses — SaaS license assets

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getScalePadCredentials, getClientSaaSAssets } from '@/lib/scalepad/client'
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
    const licenses = await getClientSaaSAssets(creds, clientId)

    return Response.json({ licenses })
  } catch (error) {
    return handleApiError(error)
  }
}
