// ============================================================
// Request Deduplication
// If multiple users request the same resource within the same
// event loop tick, share the single in-flight Promise.
// ============================================================

const inFlight = new Map<string, Promise<unknown>>()

/**
 * Deduplicate concurrent identical requests.
 * If the same key is already being fetched, all callers
 * share the same Promise rather than firing duplicate API calls.
 */
export async function deduplicatedFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const existing = inFlight.get(key)
  if (existing) {
    return existing as Promise<T>
  }

  const promise = fetcher().finally(() => {
    inFlight.delete(key)
  })

  inFlight.set(key, promise)
  return promise
}
