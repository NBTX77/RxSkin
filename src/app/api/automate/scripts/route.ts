// ============================================================
// GET  /api/automate/scripts?search=Disk — List scripts
// POST /api/automate/scripts            — Run a script
// ============================================================

import { auth } from '@/lib/auth/config'
import {
  getAutomateCredentials,
  isAutomateConfigured,
  getScripts,
  runScript,
} from '@/lib/automate/client'
import { cachedFetch } from '@/lib/cache/bff-cache'
import { deduplicatedFetch } from '@/lib/cache/dedup'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const SCRIPT_LIST_TTL_MS = 5 * 60 * 1000 // 5 minutes (scripts don't change often)

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    if (!isAutomateConfigured()) {
      return apiErrors.internal('Automate credentials not configured')
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? undefined

    const cacheKey = `automate:scripts:${search ?? 'all'}`
    const creds = getAutomateCredentials()

    const scripts = await deduplicatedFetch(cacheKey, () =>
      cachedFetch(cacheKey, () => getScripts(creds, search), SCRIPT_LIST_TTL_MS)
    )

    return Response.json(scripts)
  } catch (error) {
    return handleApiError(error)
  }
}

const runScriptSchema = z.object({
  scriptId: z.number(),
  computerIds: z.array(z.number()).min(1),
  parameters: z.record(z.string()).optional(),
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()
    if (session.user.role === 'VIEWER') return apiErrors.forbidden()

    if (!isAutomateConfigured()) {
      return apiErrors.internal('Automate credentials not configured')
    }

    const body = await request.json()
    const parsed = runScriptSchema.safeParse(body)
    if (!parsed.success) {
      return apiErrors.badRequest(parsed.error.issues.map(i => i.message).join(', '))
    }

    const creds = getAutomateCredentials()
    const result = await runScript(
      creds,
      parsed.data.scriptId,
      parsed.data.computerIds,
      parsed.data.parameters
    )

    return Response.json(result, { status: 202 })
  } catch (error) {
    return handleApiError(error)
  }
}
