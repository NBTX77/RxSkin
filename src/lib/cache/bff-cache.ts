import { LRUCache } from 'lru-cache'

const DEFAULT_TTL_MS = 60 * 1000

// LRU cache value type must extend {} (lru-cache v10 requirement)
type CacheValue = object | string | number | boolean

const cache = new LRUCache<string, CacheValue>({
  max: 500,
  ttl: DEFAULT_TTL_MS,
  allowStale: false,
})

export async function cachedFetch<T extends CacheValue>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const cached = cache.get(key) as T | undefined
  if (cached !== undefined) return cached

  const data = await fetcher()
  cache.set(key, data, { ttl: ttlMs })
  return data
}

export function invalidateCache(keyPrefix: string): void {
  Array.from(cache.keys()).forEach((key) => {
    if (key.startsWith(keyPrefix)) cache.delete(key)
  })
}

export function invalidateCacheKey(key: string): void {
  cache.delete(key)
}

export function clearCache(): void {
  cache.clear()
}

export function getCacheStats() {
  return {
    size: cache.size,
    max: cache.max,
    calculatedSize: cache.calculatedSize,
  }
}
