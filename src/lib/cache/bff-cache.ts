// ============================================================
// BFF In-Memory Cache — RX Skin
// Server-side LRU cache shared across all users on same instance.
// Tier 2 of the 3-tier caching strategy.
// ============================================================

import { LRUCache } from 'lru-cache'

const DEFAULT_TTL_MS = 60 * 1000 // 60 seconds

type CacheValue = object | string | number | boolean

const cache = new LRUCache<string, CacheValue>({
  max: 500,
  ttl: DEFAULT_TTL_MS,
  allowStale: false,
})

/**
 * Fetch with BFF cache. Returns cached value if fresh, otherwise
 * calls fetcher, stores result, and returns it.
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const cached = cache.get(key) as T | undefined
  if (cached !== undefined) {
    return cached
  }

  const data = await fetcher()
  cache.set(key, data as CacheValue, { ttl: ttlMs })
  return data
}

/**
 * Invalidate all cache entries whose key starts with the given prefix.
 */
export function invalidateCache(keyPrefix: string): void {
  Array.from(cache.keys()).forEach((key) => {
    if (key.startsWith(keyPrefix)) {
      cache.delete(key)
    }
  })
}

/**
 * Invalidate a single exact cache key.
 */
export function invalidateCacheKey(key: string): void {
  cache.delete(key)
}

/**
 * Clear the entire cache.
 */
export function clearCache(): void {
  cache.clear()
}

/**
 * Get current cache stats for monitoring.
 */
export function getCacheStats() {
  return {
    size: cache.size,
    max: cache.max,
    calculatedSize: cache.calculatedSize,
  }
}
