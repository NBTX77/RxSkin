# API_STRATEGY.md — API Design, Caching & Performance

> Covers the BFF architecture, caching strategy, rate limiting, and performance approach for RX Skin's API layer.

---

## Core Principle: BFF (Backend for Frontend)

All external API calls (ConnectWise, Microsoft Graph, etc.) are made **server-side only** via Next.js API routes. The browser never directly calls any third-party API.

```
Browser → /api/tickets (our BFF) → ConnectWise API
         ↑                        ↑
      No credentials         Credentials injected
      exposed here            server-side only
```

This is non-negotiable for security, rate limit management, and caching control.

---

## Caching Architecture

### Three-Tier Cache

```
Tier 1: Browser (React Query)
   ↓ cache miss
Tier 2: BFF In-Memory Cache (LRU)
   ↓ cache miss
Tier 3: External API (ConnectWise, Graph, etc.)
```

Each tier serves as a fallback and has different TTL characteristics.

---

### Tier 1 — React Query (Browser Cache)

React Query caches API responses in memory in the browser. Configuration tuned for MSP data patterns:

```typescript
// lib/query-client.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,        // 30s — data considered fresh
      gcTime: 5 * 60 * 1000,       // 5min — garbage collect unused cache
      retry: 3,                     // Retry 3x before showing error
      retryDelay: attemptIndex =>   // Exponential backoff
        Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,  // Don't thrash on tab switch
      refetchOnReconnect: true,     // Refetch when connection restored
    },
  },
});
```

**Per-resource stale times:**

| Resource | staleTime | Reason |
|----------|-----------|--------|
| Ticket list | 30s | Changes frequently |
| Ticket detail | 30s | Updated by tech in real time |
| Schedule entries | 15s | Real-time scheduling matters |
| Company list | 5min | Rarely changes |
| Contact list | 5min | Rarely changes |
| Member list | 10min | Very stable |
| Configurations | 30min | Hardware data, stable |
| Boards/Types | 1hr | Static reference data |

**Cache key factory (always tenant-scoped):**

```typescript
// lib/query-keys.ts
export const queryKeys = {
  tickets: {
    all: (tenantId: string) =>
      ['tickets', tenantId] as const,
    list: (tenantId: string, filters: TicketFilters) =>
      ['tickets', tenantId, 'list', filters] as const,
    detail: (tenantId: string, id: number) =>
      ['tickets', tenantId, 'detail', id] as const,
    notes: (tenantId: string, id: number) =>
      ['tickets', tenantId, 'notes', id] as const,
  },
  schedule: {
    entries: (tenantId: string, range: DateRange) =>
      ['schedule', tenantId, 'entries', range] as const,
  },
  companies: {
    all: (tenantId: string) =>
      ['companies', tenantId] as const,
    detail: (tenantId: string, id: number) =>
      ['companies', tenantId, 'detail', id] as const,
  },
  members: {
    all: (tenantId: string) =>
      ['members', tenantId] as const,
  },
};
```

**Optimistic updates for mutations:**

```typescript
// Ticket status update — optimistic pattern
useMutation({
  mutationFn: (update: TicketUpdate) => updateTicket(update),
  onMutate: async (update) => {
    // Cancel any outgoing refetches
    await queryClient.cancelQueries({ queryKey: queryKeys.tickets.detail(tenantId, update.id) });

    // Snapshot previous value
    const previousTicket = queryClient.getQueryData(queryKeys.tickets.detail(tenantId, update.id));

    // Optimistically update
    queryClient.setQueryData(queryKeys.tickets.detail(tenantId, update.id), old => ({
      ...old,
      ...update,
    }));

    return { previousTicket };
  },
  onError: (err, update, context) => {
    // Rollback on error
    queryClient.setQueryData(
      queryKeys.tickets.detail(tenantId, update.id),
      context?.previousTicket
    );
  },
  onSettled: () => {
    // Refetch to confirm server state
    queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all(tenantId) });
  },
});
```

---

### Tier 2 — BFF In-Memory Cache

Server-side LRU cache in the Next.js process. Shared across all users hitting the same server instance.

```typescript
// lib/cache/bff-cache.ts
import LRUCache from 'lru-cache';

const cache = new LRUCache<string, unknown>({
  max: 500,          // Max 500 entries
  ttl: 60 * 1000,   // Default 60s TTL
  allowStale: false,
});

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs?: number
): Promise<T> {
  const cached = cache.get(key) as T | undefined;
  if (cached !== undefined) return cached;

  const data = await fetcher();
  cache.set(key, data, { ttl: ttlMs });
  return data;
}

export function invalidateCache(keyPattern: string) {
  // Invalidate all cache keys matching prefix
  for (const key of cache.keys()) {
    if (key.startsWith(keyPattern)) {
      cache.delete(key);
    }
  }
}
```

**BFF cache TTLs:**

| Resource | BFF TTL | Note |
|----------|---------|------|
| Ticket list | 60s | Multiple users benefit |
| Ticket detail | 30s | Lower — changes frequently |
| Schedule entries | 30s | |
| Company list | 5min | Very stable |
| Member list | 10min | Almost never changes |
| CW boards | 1hr | Reference data |
| CW priorities | 1hr | Reference data |
| CW statuses | 1hr | Reference data |

**Cache key format:**
```
{tenantId}:{resource}:{params-hash}

Examples:
rx-tech:tickets:list:{"status":"New","boardId":1}
rx-tech:tickets:detail:1234
rx-tech:members:all
```

**Cache invalidation on mutation:**
```typescript
// After updating a ticket — invalidate relevant BFF cache entries
async function updateTicket(tenantId: string, ticketId: number, update: TicketUpdate) {
  const result = await cwClient(tenantId).patch(`/service/tickets/${ticketId}`, update);

  // Invalidate specific ticket and list caches
  invalidateCache(`${tenantId}:tickets:detail:${ticketId}`);
  invalidateCache(`${tenantId}:tickets:list:`); // All list variants

  return result;
}
```

---

### Redis (Optional — Future Scaling)

Redis is NOT required for Phase 1 (6-15 users, single server instance). Add Redis when:
- Multiple server instances are deployed (Vercel can scale horizontally)
- Cache needs to survive server restarts
- Team grows beyond ~20 concurrent users

When adding Redis:
- Replace `lru-cache` with `ioredis` in `lib/cache/bff-cache.ts`
- Use `REDIS_URL` env var
- Keep the same `cachedFetch` interface — only the implementation changes
- Consider `@upstash/redis` for serverless-compatible Redis on Vercel

---

## Rate Limit Management

### ConnectWise Rate Limits

- **Limit:** ~40 requests/second per API member
- **Response on exceed:** HTTP 429 with `Retry-After` header
- **Strategy:** Cache aggressively + handle 429 gracefully

```typescript
// lib/cw/client.ts — rate limit handler
async function cwFetch<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') ?? '5');
    throw new RateLimitError(retryAfter);
  }

  if (!response.ok) {
    throw new CWApiError(response.status, await response.text());
  }

  return response.json();
}
```

**BFF-level retry with backoff:**
```typescript
// lib/cw/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof RateLimitError) {
        if (attempt === maxAttempts) throw error;
        await sleep(error.retryAfterMs);
      } else {
        throw error; // Non-retryable errors throw immediately
      }
      lastError = error as Error;
    }
  }

  throw lastError!;
}
```

### Microsoft Graph Rate Limits

- Microsoft uses adaptive throttling (no published fixed limits)
- Practical: ~4 sustained req/sec per app, burst to 12
- Use batch endpoint (`/$batch`) for up to 20 requests per call
- Always respect `Retry-After` header

### Request Deduplication

Prevents duplicate in-flight requests when multiple users hit the same endpoint simultaneously:

```typescript
// lib/cache/dedup.ts
const inFlight = new Map<string, Promise<unknown>>();

export async function deduplicatedFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  if (inFlight.has(key)) {
    return inFlight.get(key) as Promise<T>;
  }

  const promise = fetcher().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}
```

With deduplication, if 5 users load the ticket list at the same second, only **one** CW API call fires.

---

## BFF API Route Design

### Route Structure

```
app/api/
├── tickets/
│   ├── route.ts           GET (list), POST (create)
│   └── [id]/
│       ├── route.ts       GET (detail), PATCH (update), DELETE
│       └── notes/
│           └── route.ts   GET (list notes), POST (add note)
├── schedule/
│   ├── route.ts           GET (entries), POST (create)
│   └── [id]/
│       └── route.ts       PATCH (reschedule), DELETE
├── companies/
│   ├── route.ts           GET (list)
│   └── [id]/
│       └── route.ts       GET (detail)
└── members/
    └── route.ts           GET (list)
```

### Standard API Route Pattern

```typescript
// app/api/tickets/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getTenantCredentials } from '@/lib/auth/credentials';
import { cwClient } from '@/lib/cw/client';
import { normalizeTicket } from '@/lib/cw/normalizers';
import { cachedFetch, invalidateCache } from '@/lib/cache/bff-cache';

export async function GET(request: Request) {
  // 1. Auth check
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { tenantId } = session.user;

  // 2. Parse query params
  const { searchParams } = new URL(request.url);
  const filters = parseTicketFilters(searchParams);

  // 3. Fetch with cache
  const cacheKey = `${tenantId}:tickets:list:${JSON.stringify(filters)}`;
  const tickets = await cachedFetch(
    cacheKey,
    async () => {
      const creds = await getTenantCredentials(tenantId);
      const raw = await cwClient(creds).getTickets(filters);
      return raw.map(normalizeTicket);
    },
    60 * 1000 // 60s TTL
  );

  return Response.json(tickets);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { tenantId } = session.user;
  const body = await request.json();

  // Validate input
  const parsed = createTicketSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error }, { status: 400 });
  }

  const creds = await getTenantCredentials(tenantId);
  const ticket = await cwClient(creds).createTicket(parsed.data);

  // Invalidate list caches
  invalidateCache(`${tenantId}:tickets:list:`);

  return Response.json(normalizeTicket(ticket), { status: 201 });
}
```

### Standard Error Responses

```typescript
// lib/api/errors.ts
export type ApiError = {
  code: string;
  message: string;
  retryable: boolean;
  retryAfter?: number;
};

export const errors = {
  unauthorized: (): Response =>
    Response.json({ code: 'UNAUTHORIZED', message: 'Not authenticated', retryable: false }, { status: 401 }),

  forbidden: (): Response =>
    Response.json({ code: 'FORBIDDEN', message: 'Insufficient permissions', retryable: false }, { status: 403 }),

  notFound: (resource: string): Response =>
    Response.json({ code: 'NOT_FOUND', message: `${resource} not found`, retryable: false }, { status: 404 }),

  rateLimited: (retryAfter: number): Response =>
    Response.json({ code: 'RATE_LIMITED', message: 'API rate limit exceeded', retryable: true, retryAfter }, { status: 503 }),

  cwError: (detail: string): Response =>
    Response.json({ code: 'CW_API_ERROR', message: 'ConnectWise API error', retryable: false }, { status: 502 }),
};
```

---

## Data Normalization

CW API responses are verbose (50+ fields). Normalizers strip unused fields and create clean frontend types.

```typescript
// lib/cw/normalizers.ts

// CW raw ticket has 60+ fields — we normalize to 20 that matter
export function normalizeTicket(raw: CWTicketRaw): Ticket {
  return {
    id: raw.id,
    summary: raw.summary,
    status: raw.status?.name ?? 'Unknown',
    statusId: raw.status?.id,
    priority: raw.priority?.name ?? 'Medium',
    priorityId: raw.priority?.id,
    board: raw.board?.name ?? 'Unknown',
    boardId: raw.board?.id,
    company: raw.company?.name ?? 'Unknown',
    companyId: raw.company?.id,
    contact: raw.contact?.name,
    contactId: raw.contact?.id,
    assignedTo: raw.owner?.name,
    assignedToId: raw.owner?.id,
    createdAt: raw.dateEntered,
    updatedAt: raw.lastUpdated,
    closedAt: raw.closedDate,
    budgetHours: raw.budgetHours,
    actualHours: raw.actualHours,
    resources: raw.resources ?? [],
  };
}
```

---

## Performance Monitoring

### Key Metrics to Track

```typescript
// lib/monitoring/metrics.ts
export function trackApiCall(
  endpoint: string,
  durationMs: number,
  cacheHit: boolean
) {
  console.log({
    event: 'api_call',
    endpoint,
    durationMs,
    cacheHit,
    timestamp: new Date().toISOString(),
  });
  // Future: send to analytics service
}
```

### Performance Targets

| Operation | Target | Acceptable | Needs Fix |
|-----------|--------|------------|-----------|
| Cached BFF response | < 50ms | < 100ms | > 200ms |
| Uncached BFF response | < 500ms | < 800ms | > 1500ms |
| Page load (FCP) | < 1.5s | < 2.5s | > 4s |
| Calendar render | < 100ms | < 300ms | > 500ms |
| Ticket form submit | < 500ms | < 1s | > 2s |
| Search / filter | < 200ms | < 500ms | > 1s |

---

## Security Checklist

Every API route must pass this checklist:

- [ ] Session check — `getServerSession()` called before any logic
- [ ] Tenant scoping — `tenantId` from session, never from request body
- [ ] Input validation — Zod schema validation on all POST/PATCH bodies
- [ ] No credentials in response — API keys, tokens never returned to browser
- [ ] Error messages — no stack traces or internal details in error responses
- [ ] Rate limit handling — 429 handled gracefully
- [ ] CORS — handled by Next.js defaults (same-origin only for API routes)

---

*Last updated: 2026-03-26*
