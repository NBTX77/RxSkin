// ============================================================
// POST /api/meraki/demo-mode — Toggle Meraki demo data mode
// Body: { enabled: boolean }
// Sets cookie that API routes read server-side.
// ============================================================

import { auth } from '@/lib/auth/config'
import { apiErrors } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    // Only admins can toggle demo mode
    const role = (session.user as Record<string, unknown>).role as string | undefined
    if (role !== 'ADMIN') return apiErrors.forbidden()

    const body = await request.json()
    const enabled = !!body.enabled

    const response = Response.json({ ok: true, demoMode: enabled })

    // Set cookie for server-side reading in API routes
    response.headers.set(
      'Set-Cookie',
      `meraki_demo_mode=${enabled}; Path=/; SameSite=Lax; Max-Age=${365 * 86400}`
    )

    return response
  } catch (error) {
    console.error('[Meraki Demo Mode]', error)
    return apiErrors.internal('Failed to toggle demo mode')
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const cookies = request.headers.get('cookie') || ''
    const match = cookies.match(/meraki_demo_mode=([^;]+)/)
    const enabled = match ? match[1] === 'true' : false

    return Response.json({ ok: true, demoMode: enabled })
  } catch (error) {
    console.error('[Meraki Demo Mode]', error)
    return apiErrors.internal('Failed to get demo mode status')
  }
}
