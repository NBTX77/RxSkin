# ARCHITECTURE.md — RX Skin Technical Architecture

> Living document. Update this whenever an architectural decision is made.

---

## System Overview

RX Skin is a **server-rendered React application** (Next.js App Router) that acts as a complete UI replacement for ConnectWise Manage. It communicates with ConnectWise and other MSP platforms exclusively through a **Backend for Frontend (BFF) layer** built into Next.js API routes. The browser never directly calls any external API.

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                           │
│              Next.js React App (App Router)                     │
│         TanStack Query · FullCalendar · dnd-kit                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS + JWT Session Cookie
┌────────────────────────────▼────────────────────────────────────┐
│                    BFF LAYER (Server-side)                       │
│              Next.js API Routes / Server Actions                 │
│   Auth Middleware → Tenant Resolver → Credential Injector       │
│          In-Memory LRU Cache · Request Deduplication            │
│              Rate Limit Manager · Response Normalizer           │
└───────┬──────────────┬──────────────┬──────────────┬────────────┘
        │              │              │              │
┌───────▼──┐  ┌────────▼───┐  ┌──────▼──────┐  ┌───▼────────────┐
│ConnectWise│  │  MS Graph  │  │  CW Automate│  │ Future APIs    │
│REST API  │  │(Office 365)│  │  REST API   │  │Auvik,Meraki,etc│
└──────────┘  └────────────┘  └─────────────┘  └────────────────┘
        │
┌───────▼──────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                          │
│        Prisma ORM · Row-Level Security · Tenant Isolation        │
│  Tenants · Tickets Cache · Users · Audit Log · Settings          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Why BFF Architecture

The BFF (Backend for Frontend) pattern is non-negotiable for this project. Reasons:

1. **Security** — ConnectWise API keys never reach the browser. A leaked key would compromise the entire CW account.
2. **Rate limiting** — CW allows ~40 req/sec per API member. With 6-15 users making simultaneous requests, the BFF aggregates and deduplicates requests, keeping total API calls well under limit.
3. **Data normalization** — CW's API responses are verbose (50+ fields per ticket). BFF strips, renames, and normalizes into clean frontend-friendly shapes.
4. **Tenant credential injection** — Every request gets the correct CW credentials for the active tenant injected server-side. Client code never sees credentials.
5. **Caching** — BFF can serve cached responses for identical requests from multiple users, dramatically reducing API calls.
6. **Request batching** — Future optimization: BFF can batch multiple client requests into single CW API calls.

---

## Authentication & Authorization

### Auth Flow

```
User visits app
       ↓
NextAuth.js checks session cookie
       ↓ (no session)
Redirect to /login
       ↓
User authenticates (username/password or SSO)
       ↓
NextAuth creates JWT containing:
  - userId
  - tenantId
  - role (admin | technician | viewer)
  - sessionExpiry
       ↓
JWT stored in httpOnly cookie (not accessible via JS)
       ↓
All API route requests validated against JWT
       ↓
Tenant credentials fetched from DB using tenantId
       ↓
CW API called with tenant credentials
```

### Role Definitions

| Role | Permissions |
|------|------------|
| `admin` | Full access; manage settings, users, tenant config |
| `technician` | Create/edit/close tickets; manage own schedule; view all companies |
| `viewer` | Read-only access to tickets and schedules |

### Tenant Credential Security

```typescript
// lib/auth/credentials.ts
// Credentials are encrypted at rest in DB using AES-256
// Decrypted only in server-side context

async function getTenantCredentials(tenantId: string): Promise<CWCredentials> {
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
  return {
    baseUrl: tenant.cwBaseUrl,
    companyId: tenant.cwCompanyId,
    publicKey: decrypt(tenant.cwPublicKey),
    privateKey: decrypt(tenant.cwPrivateKey),
    clientId: tenant.cwClientId,
  };
}
```

---

## Multi-Tenant Design

### Phase 1 (Current): Single Tenant

RX Technology operates as the sole tenant. `tenantId` is still applied to all queries (critical — this prevents a painful migration later).

### Phase 2: Multi-Tenant

Each tenant represents either:
- A different MSP (if RX Technology white-labels this product)
- A "virtual tenant" per managed client company (for client-facing portals)

### Database Isolation Strategy

**Approach: Shared schema with Row-Level Security (PostgreSQL RLS)**

Every table includes `tenant_id`. RLS policies enforce that queries only return rows matching the active tenant.

```sql
-- Applied to ALL tables
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_tickets ON tickets
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- BFF sets this at the start of every DB transaction:
SET LOCAL app.current_tenant = 'uuid-of-current-tenant';
```

This approach:
- Works with a single database and single deployment
- Scales to 1000+ tenants without schema changes
- Prevents data leakage at the database level (defense in depth)

### Cache Key Strategy

All React Query keys and server-side cache keys are tenant-namespaced:

```typescript
// React Query key factory
export const queryKeys = {
  tickets: {
    all: (tenantId: string) => ['tickets', tenantId] as const,
    list: (tenantId: string, filters: TicketFilters) => ['tickets', tenantId, 'list', filters] as const,
    detail: (tenantId: string, ticketId: number) => ['tickets', tenantId, ticketId] as const,
  },
  schedule: {
    entries: (tenantId: string, range: DateRange) => ['schedule', tenantId, range] as const,
  }
};

// Server-side cache key
const cacheKey = `tickets:${tenantId}:list:${JSON.stringify(filters)}`;
```

---

## Data Flow: Creating a Ticket

```
User fills TicketForm (client component)
       ↓
useCreateTicket() mutation (TanStack Query)
       ↓
POST /api/tickets (BFF API route)
       ↓
Auth middleware validates JWT
       ↓
Tenant resolver injects CW credentials
       ↓
BFF calls POST /service/tickets on CW API
       ↓
CW returns new ticket
       ↓
BFF normalizes response → saves to local DB cache
       ↓
Invalidate React Query cache for ['tickets', tenantId]
       ↓
UI refetches ticket list → shows new ticket
```

---

## Data Flow: Loading Ticket List

```
TicketList component mounts
       ↓
useTickets() hook fires (TanStack Query)
       ↓ Check cache
React Query cache HIT (< 30s old) → return cached data immediately
       ↓ Cache MISS
GET /api/tickets (BFF API route)
       ↓ Check BFF cache
BFF in-memory cache HIT → return normalized data
       ↓ BFF cache MISS
BFF calls GET /service/tickets on CW API
       ↓
CW returns ticket list
       ↓
BFF normalizes, strips unused fields, stores in BFF cache (TTL 60s)
       ↓
Response to client → React Query stores in browser cache (staleTime 30s)
       ↓
TicketList renders
```

---

## Scheduler Architecture

The scheduling view is one of the most complex components. Here's how it works:

### Calendar Layers

```
ScheduleView (page component)
├── CalendarHeader (view switcher: Day | Week | 2-Week | Month)
├── FullCalendar
│   ├── Schedule entries (from /api/schedule)
│   ├── Ticket events (converted from service tickets)
│   └── Drag-drop overlay (dnd-kit)
├── ResourceSidebar (tech names, filter by tech)
└── QuickCreateModal (inline ticket creation on drop)
```

### Drag and Drop

FullCalendar handles most drag-drop internally. Custom dnd-kit integration used for:
- Dragging unscheduled tickets from the queue onto the calendar
- Reordering queue items

Events:
- `eventDrop` → PATCH `/api/schedule/{id}` (update start/end time)
- `eventResize` → PATCH `/api/schedule/{id}` (update duration)
- Drop from queue → POST `/api/schedule` (create new schedule entry)

All operations are **optimistic** — UI updates instantly, API call fires in background, rolls back on error.

---

## Mobile Strategy

Every component is built mobile-first using Tailwind breakpoints:

```
Default (mobile): 375px base
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

Mobile-specific adaptations:
- Calendar defaults to **Day view** on mobile (`< md`)
- Ticket list uses **card layout** on mobile vs table on desktop
- Drag-drop uses touch events via dnd-kit's touch sensor
- Bottom navigation bar on mobile (`< md`)
- Full-screen modals replace side panels on mobile

---

## Performance Targets

| Metric | Target | How |
|--------|--------|-----|
| First Contentful Paint | < 1.5s | Server Components, code splitting |
| Time to Interactive | < 2.5s | Minimal JS bundle, progressive hydration |
| Cached API response | < 50ms | In-memory BFF cache |
| Uncached API response | < 800ms | CW API + normalization |
| Calendar render (100 events) | < 100ms | FullCalendar virtualization |
| Mobile Lighthouse score | > 85 | Image optimization, lazy loading |

---

## Error Handling

### API Errors

```typescript
// All BFF routes return consistent error shapes
type ApiError = {
  code: string;       // 'CW_RATE_LIMIT', 'AUTH_EXPIRED', 'NOT_FOUND', etc.
  message: string;    // Human-readable
  retryable: boolean; // Whether client should retry
  retryAfter?: number; // Seconds to wait before retry
};
```

### CW API Rate Limiting (429)

BFF intercepts 429 responses:
1. Adds request to retry queue with `Retry-After` delay
2. Returns 503 to client with `retryable: true` and `retryAfter`
3. React Query retries automatically after delay

### Network Failure

- React Query retries 3x with exponential backoff
- Stale cache shown while retrying (stale-while-revalidate)
- Clear error toast after 3 failures

---

## Architectural Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-26 | Next.js App Router | App Router is now stable and default; better Server Components support; no Pages Router |
| 2026-03-26 | BFF pattern via API routes | Security (credential isolation), rate limiting, caching control |
| 2026-03-26 | TanStack Query v5 | Superior cache invalidation vs SWR for multi-entity MSP data |
| 2026-03-26 | FullCalendar React | Most complete mobile+desktop calendar with drag-drop; $99/dev worth it |
| 2026-03-26 | PostgreSQL + RLS | Multi-tenant from day one; Row-Level Security prevents data leakage at DB level |
| 2026-03-26 | Prisma ORM | Type-safe queries, migration management, works well with Next.js |
| 2026-03-26 | shadcn/ui | Copy-paste component library (not a dependency); full control over components; Tailwind-native |
| 2026-03-26 | dnd-kit for drag | Lighter than React DnD; excellent touch support; accessible by default |
| 2026-03-26 | Tenant ID on all tables | Build multi-tenant DB structure from day one to avoid painful migration later |

---

*Last updated: 2026-03-26*
