// ============================================================
// Tenant Context — RX Skin
// Resolves the current tenant ID for instrumentation and caching.
// Supports both session-based (Phase 2) and fallback (Phase 1) modes.
// ============================================================

import prisma from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'

let cachedDefaultTenantId: string | null = null

/**
 * Resolve tenant ID from the current session (JWT).
 * Falls back to the default tenant if no session is available
 * (e.g., cron jobs, background tasks).
 */
export async function resolveTenantId(): Promise<string> {
  // Try session-based resolution first (multi-tenant ready)
  try {
    const session = await auth()
    if (session?.user?.tenantId) {
      return session.user.tenantId
    }
  } catch {
    // Session not available (cron jobs, non-request contexts) — fall through
  }

  // Fallback to default tenant (Phase 1 single-tenant mode)
  return getDefaultTenantId()
}

/**
 * Get the default tenant ID (single-tenant fallback).
 * Caches the result in-memory to avoid repeated DB lookups.
 */
export async function getDefaultTenantId(): Promise<string> {
  if (cachedDefaultTenantId) return cachedDefaultTenantId

  try {
    const tenant = await prisma.tenant.findFirst({
      where: { isActive: true },
      select: { id: true },
    })

    if (tenant) {
      cachedDefaultTenantId = tenant.id
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
  cachedDefaultTenantId = null
}
