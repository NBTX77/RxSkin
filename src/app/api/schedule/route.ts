// GET /api/schedule  — List schedule entries
// POST /api/schedule — Create a new schedule entry

import { auth } from '@/lib/auth/config'
import { getTenantCredentials } from '@/lib/auth/credentials'
import { getScheduleEntries, createScheduleEntry, getMembers } from '@/lib/cw/client'
import { cachedFetch, invalidateCache } from '@/lib/cache/bff-cache'
import { deduplicatedFetch } from '@/lib/cache/dedup'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { z } from 'zod'
import type { ScheduleFilters, DepartmentCode, ScheduleEntry } from '@/types'
import { isDepartmentCode } from '@/types'

export const dynamic = 'force-dynamic'

const SCHEDULE_TTL_MS = 60 * 1000 // 60 seconds
const MEMBERS_TTL_MS = 10 * 60 * 1000 // 10 minutes

function isCWConfigured(): boolean {
  return !!(process.env.CW_BASE_URL && process.env.CW_PUBLIC_KEY && process.env.CW_PRIVATE_KEY)
}

/**
 * Calculate the start/end date range for a given anchor date and view mode.
 */
function getDateRange(dateStr: string, view: string): { start: string; end: string } {
  const d = new Date(dateStr + 'T00:00:00')

  if (view === 'day') {
    return { start: dateStr, end: dateStr }
  }

  if (view === 'twoWeek') {
    const dayOfWeek = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7))
    const endDate = new Date(monday)
    endDate.setDate(monday.getDate() + 13) // 2 weeks = 14 days
    return {
      start: monday.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    }
  }

  if (view === 'month') {
    const year = d.getFullYear()
    const month = d.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
    }
  }

  // Default: week view — Monday to Friday
  const dayOfWeek = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7))
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  return {
    start: monday.toISOString().split('T')[0],
    end: friday.toISOString().split('T')[0],
  }
}

/**
 * Get member IDs for a specific department.
 * Uses cached members list and filters by department code.
 */
async function getMemberIdsForDepartment(
  tenantId: string,
  deptCode: DepartmentCode
): Promise<Set<number>> {
  const cacheKey = `${tenantId}:members:all`
  const members = await cachedFetch(
    cacheKey,
    async () => {
      const creds = await getTenantCredentials(tenantId)
      return getMembers(creds)
    },
    MEMBERS_TTL_MS
  )

  const deptMembers = members.filter(m => m.department === deptCode)
  return new Set(deptMembers.map(m => m.id))
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date') ?? new Date().toISOString().split('T')[0]
    const viewMode = searchParams.get('view') ?? 'week'
    const departmentParam = searchParams.get('department') ?? undefined

    if (!isCWConfigured()) {
      return Response.json(
        { code: 'SERVICE_UNAVAILABLE', message: 'ConnectWise API not configured', retryable: false },
        { status: 503 }
      )
    }

    const { tenantId } = session.user
    const { start, end } = getDateRange(dateParam, viewMode)

    const filters: ScheduleFilters = {
      start,
      end,
      memberId: searchParams.get('memberId') ? Number(searchParams.get('memberId')) : undefined,
    }

    const cacheKey = `${tenantId}:schedule:${JSON.stringify(filters)}`

    let entries: ScheduleEntry[] = await deduplicatedFetch(cacheKey, () =>
      cachedFetch(
        cacheKey,
        async () => {
          const creds = await getTenantCredentials(tenantId)
          return getScheduleEntries(creds, filters)
        },
        SCHEDULE_TTL_MS
      )
    )

    // Filter by department if specified (server-side filtering by member department)
    if (departmentParam && isDepartmentCode(departmentParam)) {
      // LT sees everything — skip filtering
      if (departmentParam !== 'LT') {
        const deptMemberIds = await getMemberIdsForDepartment(tenantId, departmentParam)
        entries = entries.filter(entry => deptMemberIds.has(entry.memberId))
      }
    }

    return Response.json(entries)
  } catch (error) {
    return handleApiError(error)
  }
}

const createScheduleSchema = z.object({
  ticketId: z.number().int().positive(),
  memberId: z.number().int().positive(),
  start: z.string().datetime(),
  end: z.string().datetime(),
})

/**
 * POST — Create a new schedule entry in ConnectWise.
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const body = await request.json()
    const parsed = createScheduleSchema.safeParse(body)
    if (!parsed.success) {
      return apiErrors.badRequest(parsed.error.issues.map(i => i.message).join(', '))
    }

    const { tenantId } = session.user
    const creds = await getTenantCredentials(tenantId)

    const newEntry = await createScheduleEntry(creds, {
      objectId: parsed.data.ticketId,
      member: { id: parsed.data.memberId },
      dateStart: parsed.data.start,
      dateEnd: parsed.data.end,
      type: { identifier: 'S' }, // Service
    })

    // Invalidate schedule cache so the list refetches
    invalidateCache(`${tenantId}:schedule`)

    return Response.json(newEntry, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
