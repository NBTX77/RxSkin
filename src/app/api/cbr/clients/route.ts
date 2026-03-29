// GET /api/cbr/clients — List all ScalePad clients for CBR dashboard

import { auth } from '@/lib/auth/config'
import { getScalePadCredentials, getScalePadClients } from '@/lib/scalepad/client'
import { apiErrors, handleApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    let creds
    try {
      creds = getScalePadCredentials()
    } catch (error) {
      if (error instanceof Error && error.message.includes('not configured')) {
        return Response.json({
          clients: [],
          warning: 'ScalePad API key is not configured. Add SCALEPAD_API_KEY to environment variables.',
        })
      }
      throw error
    }

    const clients = await getScalePadClients(creds)

    return Response.json({ clients })
  } catch (error) {
    return handleApiError(error)
  }
}
