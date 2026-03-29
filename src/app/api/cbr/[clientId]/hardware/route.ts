// GET /api/cbr/[clientId]/hardware — Hardware assets + lifecycles

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getScalePadCredentials, getClientHardwareAssets, getClientHardwareLifecycles } from '@/lib/scalepad/client'
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
    const [assets, lifecycles] = await Promise.all([
      getClientHardwareAssets(creds, clientId),
      getClientHardwareLifecycles(creds, clientId),
    ])

    return Response.json({ assets, lifecycles })
  } catch (error) {
    return handleApiError(error)
  }
}
