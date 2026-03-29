# INSTRUCTIONS.md — AI Session Guide for RX Skin

> **For Claude / AI assistant use.**
> Read this at the start of every session alongside CLAUDE.md. It defines how AI should approach work on this project.

---

## Who You Are Helping

Travis Brown — owner of RX Technology, an MSP. He is building a modern frontend portal for ConnectWise Manage. He has strong business knowledge of the MSP space and is working with AI as a development partner. He wants direct, concise communication — no filler, no fluff.

---

## Start of Every Session Checklist

Before writing any code or making any changes, you must:

1. Read `CLAUDE.md` — understand the current project state and phase
2. Check `docs/ROADMAP.md` — understand what phase is active and what tasks are queued
3. If Asana is connected — check open tasks in the active sprint
4. Ask Travis what he wants to work on today if he hasn't specified
5. Confirm which branch you are working on before making changes

---

## How to Approach Development Tasks

### Before Writing Code
- State your approach clearly before implementing
- If a decision has architectural impact, document it in `docs/ARCHITECTURE.md`
- If unsure about a CW API endpoint or behavior, check `docs/INTEGRATIONS.md` first
- For any new feature, check if it belongs in the current phase or a future phase

### While Writing Code
- TypeScript strict mode — no `any` types
- Mobile-first — test every component mentally at 375px
- BFF rule — CW API calls in `app/api/` only, never in client components
- Tenant scoping — every database query and cache key must include `tenantId`
- Comments for non-obvious logic; JSDoc for all exported functions and types
- Conventional Commits format for all commits

### After Writing Code
- Write or update unit tests for utilities
- Write or update integration tests for API routes
- Check that the component renders on mobile
- Update `docs/ARCHITECTURE.md` if a new pattern was introduced
- Mark the Asana task as complete
- Summarize what was done concisely for Travis

---

## Code Quality Standards

### TypeScript
```typescript
// ✅ Good — explicit types
async function getTickets(tenantId: string, params: TicketQueryParams): Promise<Ticket[]>

// ❌ Bad — implicit any
async function getTickets(tenantId, params)
```

### API Routes (BFF)
```typescript
// ✅ Good — all CW calls in API route, tenant-scoped
// app/api/tickets/route.ts
export async function GET(request: Request) {
  const session = await getServerSession();
  const tenantId = session.user.tenantId;
  const creds = await getTenantCredentials(tenantId);
  const tickets = await cwClient(creds).getTickets(params);
  return Response.json(tickets);
}

// ❌ Bad — direct CW call from client component
// components/TicketList.tsx
const tickets = await fetch('https://api.connectwise.com/...');
```

### React Query Cache Keys
```typescript
// ✅ Always include tenantId
const { data } = useQuery({
  queryKey: ['tickets', tenantId, filters],
  queryFn: () => fetchTickets(tenantId, filters)
});

// ❌ Missing tenant scope
const { data } = useQuery({
  queryKey: ['tickets'],
  queryFn: fetchTickets
});
```

---

## File & Folder Conventions

| Pattern | Example |
|---------|---------|
| Page components | `app/(dashboard)/tickets/page.tsx` |
| API routes | `app/api/tickets/route.ts` |
| Shared components | `components/tickets/TicketCard.tsx` |
| UI primitives | `components/ui/button.tsx` (shadcn) |
| Hooks | `hooks/useTickets.ts` |
| Types | `types/tickets.ts` |
| CW API client | `lib/cw/client.ts` |
| DB queries | `lib/db/tickets.ts` |

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `TicketCard`, `ScheduleView` |
| Hooks | camelCase + `use` prefix | `useTickets`, `useSchedule` |
| API functions | camelCase | `getTickets`, `updateScheduleEntry` |
| DB models | PascalCase (Prisma) | `Ticket`, `ScheduleEntry`, `Tenant` |
| CSS classes | Tailwind utility classes only | `className="flex gap-2 items-center"` |
| Env vars | SCREAMING_SNAKE_CASE | `CW_BASE_URL`, `NEXTAUTH_SECRET` |
| Branch names | kebab-case with prefix | `feat/ticket-drag-drop`, `fix/mobile-nav` |

---

## What NOT to Do

- **Never** put API credentials in client-side code
- **Never** call ConnectWise API directly from a React component
- **Never** skip `tenantId` in database queries
- **Never** commit `.env.local` or any file containing secrets
- **Never** use `any` TypeScript type without a comment explaining why
- **Never** create a component without considering mobile layout
- **Never** hardcode CW company IDs or member IDs
- **Never** mark a task done without testing it works
- **Never** push to `main` directly — always use PRs

---

## Communication Style

Travis prefers:
- Direct and concise responses
- Short paragraphs, one idea each
- No corporate filler phrases
- Lead with the answer, explain after
- When giving options — state which one you recommend and why
- When blocked — say so clearly and state what's needed to unblock

---

## When You Find a Bug

1. Document it with: what broke, what the expected behavior is, what the actual behavior is
2. Check if it's a known issue in GitHub Issues / Asana
3. Create a `fix/` branch
4. Fix it, write a regression test
5. PR to `develop`
6. Note it in session summary

---

## When You Want to Add a Feature Not in the Roadmap

1. Flag it to Travis — "This isn't in the current roadmap but might be worth adding: [feature]. It would take ~[time]. Want me to add it to Phase [X]?"
2. If approved — add to `docs/ROADMAP.md` under the appropriate phase
3. Create Asana task
4. Create GitHub Issue

---

## Session End Checklist

Before ending a session:
1. All changed files are saved to workspace folder
2. No uncommitted changes left in a broken state
3. `docs/ARCHITECTURE.md` updated if any new patterns introduced
4. Asana tasks updated to reflect current status
5. Brief summary ready for Travis: what was completed, what's next

---

*Last updated: 2026-03-26*
