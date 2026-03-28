# RX Skin - API Strategy

## BFF Pattern
All external API calls through Next.js API Routes. Browser never calls external APIs directly.
Credentials server-side, rate limiting centralized, responses normalized.

## Caching
- BFF Cache: In-memory LRU (src/lib/cache/bff-cache.ts), 30s TTL
- Request Dedup: src/lib/cache/dedup.ts, inflight collapse
- TanStack Query: Client-side, 30s staleTime, polling for real-time data

## Error Handling
Standardized via src/lib/api/errors.ts. Fleet API: per-source .catch() for graceful degradation.
TanStack Query retries 3x with exponential backoff.

## Rate Limiting
- ConnectWise: ~40 req/sec per API member
- Samsara: 100 req/min
- Polling: fleet 10s, analytics 60s

Last updated: 2026-03-28
