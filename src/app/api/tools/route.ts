// GET /api/tools — Return list of external tool links

import { auth } from '@/lib/auth/config'
import { apiErrors } from '@/lib/api/errors'
import { DEFAULT_TOOLS } from '@/lib/cw/tools'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    // Phase 1: Return static default tools
    // Phase 2: Merge with tenant-specific tools from DB
    return Response.json(DEFAULT_TOOLS)
  } catch {
    return Response.json({ error: 'Failed to fetch tools' }, { status: 500 })
  }
}
