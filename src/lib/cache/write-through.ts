// ============================================================
// Write-Through Cache — RX Skin
// Extends the in-memory LRU cache with persistent DB backing.
// Pattern: Read from memory first → DB second → API last.
// On API fetch, write result to both DB and memory.
// ============================================================

import prisma from '@/lib/db/prisma'
import { cachedFetch } from './bff-cache'
import type { Project, Company } from '@/types'

// ── Project Cache ─────────────────────────────────────────

/**
 * Get projects from cache (memory → DB → API).
 * On API hit, persists to DB for cross-instance durability.
 */
export async function getCachedProjects(
  tenantId: string,
  apiFetcher: () => Promise<Project[]>,
  memoryTtlMs = 60_000
): Promise<Project[]> {
  const memKey = `projects:${tenantId}`

  return cachedFetch<Project[]>(
    memKey,
    async () => {
      // Try DB cache first
      const dbCached = await getProjectsFromDb(tenantId)
      if (dbCached.length > 0) {
        return dbCached
      }

      // Fall through to API
      const apiData = await apiFetcher()

      // Write-through to DB (fire and forget)
      writeProjectsToDb(tenantId, apiData).catch((err) =>
        console.error('[write-through] Failed to cache projects:', err?.message)
      )

      return apiData
    },
    memoryTtlMs
  )
}

/**
 * Read projects from the DB cache table.
 */
async function getProjectsFromDb(tenantId: string): Promise<Project[]> {
  try {
    // Only return if cached within the last 5 minutes
    const staleThreshold = new Date(Date.now() - 5 * 60 * 1000)

    const rows = await prisma.projectCache.findMany({
      where: {
        tenantId,
        cachedAt: { gte: staleThreshold },
      },
      orderBy: { cwProjectId: 'desc' },
    })

    if (rows.length === 0) return []

    return rows.map((r) => ({
      id: r.cwProjectId,
      name: r.name,
      status: r.status ?? '',
      statusId: r.statusId ?? undefined,
      board: '', // Not cached — populated on fresh API fetch
      department: (r.department ?? '') as Project['department'],
      manager: r.manager ?? '',
      managerId: r.managerId?.toString(),
      company: r.company ?? '',
      companyId: r.companyId ?? undefined,
      budgetHours: r.budgetHours ?? 0,
      actualHours: r.actualHours ?? 0,
      billing: r.billing ?? '',
      estimatedStart: r.estimatedStart?.toISOString(),
      estimatedEnd: r.estimatedEnd?.toISOString(),
    }))
  } catch (err) {
    console.error('[write-through] DB read failed for projects:', err)
    return [] // Fall through to API
  }
}

/**
 * Write projects to the DB cache (upsert pattern).
 */
async function writeProjectsToDb(
  tenantId: string,
  projects: Project[]
): Promise<void> {
  const now = new Date()

  // Use a transaction for batch upsert
  await prisma.$transaction(
    projects.map((p) =>
      prisma.projectCache.upsert({
        where: {
          tenantId_cwProjectId: {
            tenantId,
            cwProjectId: p.id,
          },
        },
        update: {
          name: p.name,
          status: p.status,
          statusId: p.statusId ?? null,
          department: p.department ?? null,
          manager: p.manager ?? null,
          managerId: p.managerId ? parseInt(p.managerId, 10) : null,
          company: p.company,
          companyId: p.companyId ?? null,
          budgetHours: p.budgetHours ?? null,
          actualHours: p.actualHours ?? null,
          billing: p.billingMethod ?? null,
          estimatedStart: p.estimatedStart ? new Date(p.estimatedStart) : null,
          estimatedEnd: p.estimatedEnd ? new Date(p.estimatedEnd) : null,
          cachedAt: now,
        },
        create: {
          tenantId,
          cwProjectId: p.id,
          name: p.name,
          status: p.status,
          statusId: p.statusId ?? null,
          department: p.department ?? null,
          manager: p.manager ?? null,
          managerId: p.managerId ? parseInt(p.managerId, 10) : null,
          company: p.company,
          companyId: p.companyId ?? null,
          budgetHours: p.budgetHours ?? null,
          actualHours: p.actualHours ?? null,
          billing: p.billingMethod ?? null,
          estimatedStart: p.estimatedStart ? new Date(p.estimatedStart) : null,
          estimatedEnd: p.estimatedEnd ? new Date(p.estimatedEnd) : null,
          cachedAt: now,
        },
      })
    )
  )

  // Update sync state
  await updateSyncState(tenantId, 'projects', projects.length)
}

// ── Company Cache ─────────────────────────────────────────

/**
 * Get companies from cache (memory → DB → API).
 */
export async function getCachedCompanies(
  tenantId: string,
  apiFetcher: () => Promise<Company[]>,
  memoryTtlMs = 120_000 // Companies change less often — 2 min memory TTL
): Promise<Company[]> {
  const memKey = `companies:${tenantId}`

  return cachedFetch<Company[]>(
    memKey,
    async () => {
      const dbCached = await getCompaniesFromDb(tenantId)
      if (dbCached.length > 0) {
        return dbCached
      }

      const apiData = await apiFetcher()

      writeCompaniesToDb(tenantId, apiData).catch((err) =>
        console.error('[write-through] Failed to cache companies:', err?.message)
      )

      return apiData
    },
    memoryTtlMs
  )
}

/**
 * Read companies from the DB cache table.
 */
async function getCompaniesFromDb(tenantId: string): Promise<Company[]> {
  try {
    const staleThreshold = new Date(Date.now() - 10 * 60 * 1000) // 10 min for companies

    const rows = await prisma.companyCache.findMany({
      where: {
        tenantId,
        cachedAt: { gte: staleThreshold },
      },
      orderBy: { name: 'asc' },
    })

    if (rows.length === 0) return []

    return rows.map((r) => ({
      id: r.cwCompanyId,
      name: r.name,
      identifier: r.identifier ?? '',
      type: r.type ?? '',
      status: r.status ?? '',
      phone: r.phone ?? '',
      website: r.website ?? '',
      city: r.city ?? '',
      state: r.state ?? '',
    }))
  } catch (err) {
    console.error('[write-through] DB read failed for companies:', err)
    return []
  }
}

/**
 * Write companies to the DB cache (upsert pattern).
 */
async function writeCompaniesToDb(
  tenantId: string,
  companies: Company[]
): Promise<void> {
  const now = new Date()

  await prisma.$transaction(
    companies.map((c) =>
      prisma.companyCache.upsert({
        where: {
          tenantId_cwCompanyId: {
            tenantId,
            cwCompanyId: c.id,
          },
        },
        update: {
          name: c.name,
          identifier: c.identifier || null,
          type: c.type || null,
          status: c.status || null,
          phone: c.phone || null,
          website: c.website || null,
          city: c.city || null,
          state: c.state || null,
          cachedAt: now,
        },
        create: {
          tenantId,
          cwCompanyId: c.id,
          name: c.name,
          identifier: c.identifier || null,
          type: c.type || null,
          status: c.status || null,
          phone: c.phone || null,
          website: c.website || null,
          city: c.city || null,
          state: c.state || null,
          cachedAt: now,
        },
      })
    )
  )

  await updateSyncState(tenantId, 'companies', companies.length)
}

// ── Sync State Tracking ──────────────────────────────────

/**
 * Update the cache_sync_state table after a successful sync.
 */
async function updateSyncState(
  tenantId: string,
  entityType: string,
  recordCount: number,
  startTime?: number
): Promise<void> {
  const now = new Date()
  const syncDurationMs = startTime ? Math.round(performance.now() - startTime) : undefined

  try {
    await prisma.cacheSyncState.upsert({
      where: {
        tenantId_entityType: { tenantId, entityType },
      },
      update: {
        lastSyncAt: now,
        recordCount,
        syncDurationMs,
        status: 'success',
        errorMessage: null,
      },
      create: {
        tenantId,
        entityType,
        lastSyncAt: now,
        recordCount,
        syncDurationMs,
        status: 'success',
      },
    })
  } catch (err) {
    console.error(`[write-through] Failed to update sync state for ${entityType}:`, err)
  }
}

/**
 * Record a failed sync attempt.
 */
export async function recordSyncError(
  tenantId: string,
  entityType: string,
  errorMessage: string
): Promise<void> {
  try {
    await prisma.cacheSyncState.upsert({
      where: {
        tenantId_entityType: { tenantId, entityType },
      },
      update: {
        status: 'error',
        errorMessage: errorMessage.slice(0, 1000),
      },
      create: {
        tenantId,
        entityType,
        lastSyncAt: new Date(),
        recordCount: 0,
        status: 'error',
        errorMessage: errorMessage.slice(0, 1000),
      },
    })
  } catch (err) {
    console.error(`[write-through] Failed to record sync error for ${entityType}:`, err)
  }
}

/**
 * Invalidate all cached data for a specific entity type.
 * Useful when a user performs a write operation (e.g., updating a project).
 */
export async function invalidateEntityCache(
  tenantId: string,
  entityType: 'projects' | 'companies'
): Promise<void> {
  try {
    if (entityType === 'projects') {
      await prisma.projectCache.deleteMany({ where: { tenantId } })
    } else if (entityType === 'companies') {
      await prisma.companyCache.deleteMany({ where: { tenantId } })
    }
  } catch (err) {
    console.error(`[write-through] Failed to invalidate ${entityType} cache:`, err)
  }
}
