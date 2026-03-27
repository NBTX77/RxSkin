# CLAUDE.md — RX Skin: ConnectWise Modern Frontend Portal

> **Master project file for AI-assisted development.**
> Read this first at the start of every session. It contains the full project context, tech stack, architectural decisions, and workflow rules.

---

## Project Identity

| Field | Value |
|-------|-------|
| **Project Name** | RX Skin |
| **Purpose** | Modern, mobile-first frontend (reskin) for ConnectWise Manage — built for MSP technician productivity |
| **Owner** | RX Technology — Travis Brown |
| **Primary Developer** | Travis Brown + AI (Claude / Cowork) |
| **Dev Environment** | Claude Cowork (Linux VM, Node.js available) |
| **Target Hosting** | TBD — Vercel preferred; architecture must be cloud-portable |
| **Current Phase** | Phase 1 — Foundation & Core Ticketing |
| **Git Repository** | https://github.com/NBTX77/RxSkin |
| **Notion Hub** | TBD (to be created) |
| **Asana Project** | TBD (to be created) |
---

## What This Project Is

RX Skin is a **full replacement frontend UI** for ConnectWise Manage. It does NOT modify ConnectWise itself — it calls the ConnectWise REST API and presents a completely reimagined interface built for speed, mobile use, and MSP multi-integration workflows.

Think: the power of ConnectWise, with the UX of a modern SaaS product.

### Core Goals
- Make ticket logging fast, smooth, and zero-friction
- Drag-and-drop ticket scheduling with Day / Week / 2-Week / Month views
- Mobile-first design — full feature parity on phones and tablets
- Multi-tenant architecture from day one (internal first, client-accessible later)
- Progressive integration hub: start with ConnectWise, grow to cover the full MSP toolchain

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 14+ (App Router) | SSR, Server Components, API routes as BFF, Vercel-native |
| **Language** | TypeScript (strict) | Type safety, autocomplete, refactor confidence |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first, fast iteration, consistent component library || **State / Data** | TanStack Query (React Query v5) | Smart caching, request deduplication, stale-while-revalidate |
| **Scheduler** | FullCalendar React | Professional drag-drop calendar with Day/Week/Month views |
| **Drag & Drop** | dnd-kit | Lightweight, accessible, touch-friendly |
| **Auth** | NextAuth.js (next-auth v5) | Session management, JWT, multi-tenant credential injection |
| **Database** | PostgreSQL (Supabase or self-hosted) | Multi-tenant RLS, fast queries, audit logs |
| **ORM** | Prisma | Type-safe DB access, migration management |
| **Icons** | Lucide React | Clean, consistent, lightweight |
| **Testing** | Vitest + React Testing Library + Playwright (E2E) | Unit, integration, and E2E coverage |
| **Deployment** | Vercel (preferred) / Docker-ready | CI/CD per branch, preview URLs, edge functions |

---

## Architecture Overview

```
Browser (React / Next.js App)
    ↕ (HTTPS, JWT)
Next.js API Routes (BFF Layer — server-side only)
    ├── Auth middleware (tenant resolution, credential injection)
    ├── Cache layer (in-memory LRU, optional Redis)
    ├── Request deduplication
    └── Rate limit management
         ↕
ConnectWise REST API  |  Microsoft Graph  |  Future integrations
```

The BFF (Backend for Frontend) layer is **critical**:
- API credentials are NEVER exposed to the browser
- All CW API calls are tenant-aware and rate-limited from the server
- Responses are normalized and cached before reaching the React app

Full architecture details: `docs/ARCHITECTURE.md`

---## ConnectWise Integration

- **API Version:** REST (v2022.1+)
- **Auth:** API Key authentication (Basic Auth with Base64 encoded `publicKey:privateKey`)
- **Rate Limit:** ~40 req/sec per API member — managed by BFF cache layer
- **Key endpoints used:** `service/tickets`, `schedule/entries`, `company/companies`, `time/entries`, `system/configurations`
- **Credentials:** Stored encrypted in database (`tenants.cw_api_key`, `tenants.cw_api_secret`) — NEVER in `.env` checked into Git

---

## Multi-Tenant Design

- **Phase 1:** Single-tenant (RX Technology internal)
- **Phase 2:** Multi-tenant (manage multiple client companies from one portal)
- Database uses `tenant_id` on every table + PostgreSQL RLS policies from day one
- Tenant switching via JWT token issued by NextAuth
- Each tenant has their own stored CW API credentials
- Cache keys always namespaced: `[tenantId, resource, id]`

---

## Integrations Roadmap

| Integration | Status | Priority | API Available |
|------------|--------|----------|---------------|
| ConnectWise Manage | Phase 1 | Critical | ✅ REST API |
| Microsoft Graph (M365) | Phase 2 | High | ✅ REST API |
| CW Automate | Phase 2 | High | ✅ REST API || Auvik | Phase 3 | Medium | ✅ REST API |
| Meraki | Phase 3 | Medium | ✅ REST API |
| Datto BCDR | Phase 3 | Medium | ✅ REST API |
| Acronis | Phase 3 | Medium | ✅ REST API |
| Fortinet | Phase 3 | Medium | ✅ REST API |
| Webex (Calling) | Phase 3 | Medium | ✅ REST API |
| Passportal | Phase 4 | Low | ❌ No public API — iframe embed |
| Scalepad | Phase 4 | Low | ❌ No public API — export sync |

Full integration details: `docs/INTEGRATIONS.md`

---

## Project Structure (Target)

```
rx-skin/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (login, etc.)
│   ├── (dashboard)/              # Protected app pages
│   │   ├── tickets/              # Ticket list + detail
│   │   ├── schedule/             # Calendar scheduler views
│   │   ├── companies/            # Client company views
│   │   └── settings/             # User & tenant settings
│   └── api/                      # BFF API routes
│       ├── auth/                 # NextAuth endpoints
│       ├── tickets/              # Ticket CRUD
│       ├── schedule/             # Schedule entries
│       └── companies/            # Company data
├── components/                   # Shared UI components
│   ├── ui/                       # shadcn/ui components
│   ├── tickets/                  # Ticket-specific components
│   └── schedule/                 # Schedule/calendar components├── lib/                          # Utilities and core logic
│   ├── cw/                       # ConnectWise API client
│   ├── cache/                    # BFF cache utilities
│   ├── auth/                     # Auth helpers
│   └── db/                       # Prisma client
├── prisma/                       # Database schema + migrations
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript types
├── docs/                         # Project documentation
│   ├── ARCHITECTURE.md
│   ├── INTEGRATIONS.md
│   ├── ROADMAP.md
│   ├── CONTRIBUTING.md
│   └── API_STRATEGY.md
├── .env.example                  # Template — never commit .env
├── CLAUDE.md                     # THIS FILE
└── INSTRUCTIONS.md               # AI session instructions
```

---

## Git Workflow

- **Main branch:** `main` — always deployable
- **Development branch:** `develop` — integration branch
- **Feature branches:** `feat/ticket-drag-drop`, `feat/schedule-week-view`, etc.
- **Bug branches:** `fix/ticket-form-validation`
- **Commit format:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`)
- **PRs:** All features merge via PR to `develop` → reviewed → merged to `main`
- **Tags:** Semantic versioning (`v0.1.0`, `v1.0.0`, etc.)
- **Never commit:** `.env`, API keys, secrets, `node_modules`
---

## Project Management

| Tool | Use |
|------|-----|
| **Asana** | Sprint tasks, feature requests, bug tracking, day-to-day work items |
| **Notion** | Project hub, architecture docs, decisions log, integration notes, API research |
| **GitHub Issues** | Code-linked bugs and technical issues (linked to Asana tasks) |
| **GitHub Projects** | Kanban board tied to GitHub Issues |

---

## Environment Variables

All secrets stored in `.env.local` (never committed). See `.env.example` for required keys.

Required variables:
```
# ConnectWise
CW_BASE_URL=
CW_CLIENT_ID=
CW_PUBLIC_KEY=
CW_PRIVATE_KEY=
CW_COMPANY_ID=

# Database
DATABASE_URL=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Microsoft Graph (Phase 2)
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=
```
---

## AI Assistant Rules (Read Every Session)

1. **Always read this file first** before starting any work
2. **Never commit secrets or credentials** — use `.env.local` only
3. **BFF layer is sacred** — CW API calls are always server-side only
4. **Tenant ID must be in every query** — never skip tenant scoping
5. **TypeScript strict mode** — no `any` types without explicit justification
6. **Mobile-first** — every component must work on 375px width
7. **Performance budget:** First contentful paint < 1.5s; API calls < 300ms cached
8. **Test before marking complete** — unit tests for utils, integration tests for API routes
9. **Document architectural decisions** in `docs/ARCHITECTURE.md` as you make them
10. **Check Asana** for open tasks before starting new work
11. When in doubt about CW API behavior — check `docs/INTEGRATIONS.md` first, then CW developer docs

---

## Key Contacts & Accounts

| Resource | Details |
|----------|---------|
| **Project Owner** | Travis Brown — travislbrown@gmail.com |
| **ConnectWise Manage** | RX Technology production instance |
| **GitHub** | TBD |
| **Vercel** | TBD |
| **Supabase / DB** | TBD |
---

## Status

- [x] Project defined and scoped
- [x] Architecture documented
- [x] Integration research complete
- [x] GitHub repository created — https://github.com/NBTX77/RxSkin
- [x] Next.js project scaffolded — `C:\Users\TBrown\Desktop\rx-skin\`
- [x] Login page built and working (stub credentials)
- [x] Dashboard, tickets, schedule, companies, settings page shells
- [x] Full ticket list UI (search, desktop table, mobile cards)
- [x] BFF API routes wired to ConnectWise
- [x] Production build clean (`next build` passes, TypeScript clean)
- [x] Vercel MCP connected
- [x] Supabase MCP connected
- [x] Git installed on Windows dev machine
- [x] Code pushed to GitHub (NBTX77/RxSkin)
- [x] Deployed to Vercel — https://rxtech.app (production)
- [x] Login working with Phase 1 demo credentials (admin@rxtech.app / RxSkin2026!)
- [ ] Real ConnectWise API credentials configured
- [ ] Supabase database created + Prisma migrations run
- [ ] ConnectWise API connection tested with live data
- [ ] Ticket detail page (`/tickets/[id]`)
- [ ] Schedule / calendar view (FullCalendar + drag-drop)

## Known Dev Environment Issues

- `next dev` Tailwind CSS broken (PostCSS ESM/CJS conflict) — use `next start` for local review
- No `middleware.ts` — removed due to Node v24 + NextAuth v5 edge runtime conflict
- `next.config.js` must be CJS format (`.mjs` breaks PostCSS loader)
- `AUTH_TRUST_HOST=1` required in `.env.local` for NextAuth v5 localhost

---

*Last updated: 2026-03-27 — Travis Brown / Claude*