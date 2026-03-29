// ============================================================
// Tenant Context — RX Skin
// Resolves the current tenant ID for instrumentation and caching.
// Phase 1: single tenant (RX Technology) — hardcoded lookup.
// Phase 2: resolve from JWT/session token.
// ============================================================

import prisma from '@/lib/db/prisma'

let cachedTenantId: string | null = null

/**
 * Get the default tenant ID for Phase 1 (single-tenant mode).
 * Caches the result in-memory to avoid repeated DB lookups.
 * In Phase 2 this will be replaced by session-based resolution.
 */
export async function getDefaultTenantId(): Promise<string> {
  if (cachedTenantId) return cachedTenantId

  try {
    const tenant = await prisma.tenant.findFirst({
      where: { isActive: true },
      select: { id: true },
    })

    if (tenant) {
      cachedTenantId = tenant.id
      return tenant.id
    }
  } catch (err) {
    console.error('[tenant-context] Failed to resolve tenant:', err)
  }

  // Fallback — return a placeholder so logging doesn't break
  return 'unknown'
}

/**
 * Clear the cached tenant ID (useful for testing or tenant changes).
 */
export function clearTenantCache(): void {
  cachedTenantId = null
}
