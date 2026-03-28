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
| **Target Hosting** | Vercel — https://rxtech.app (production) |
| **Current Phase** | Phase 1A Complete — Department Routing + Projects Board |
| **Git Repository** | https://github.com/NBTX77/RxSkin |
| **Notion Hub** | https://www.notion.so/32ffac121d4981c6bda6d0163795af05 |
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
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first, fast iteration, consistent component library |
| **State / Data** | TanStack Query (React Query v5) | Smart caching, request deduplication, stale-while-revalidate |
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
Full auth architecture: `docs/AUTH_ARCHITECTURE.md`

---

## ConnectWise Integration

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
| CW Automate | Phase 2 | High | ✅ REST API (MCP connected) |
| CW Control (ScreenConnect) | Phase 2 | High | ✅ REST API — control.rxtech.com |
| Auvik | Phase 3 | Medium | ✅ REST API |
| Meraki | Phase 3 | Medium | ✅ REST API |
| Datto BCDR | Phase 3 | Medium | ✅ REST API |
| Acronis | Phase 3 | Medium | ✅ REST API |
| Fortinet | Phase 3 | Medium | ✅ REST API |
| Webex (Calling + Messaging) | Phase 2 | High | ✅ REST API + OAuth2 |
| SentinelOne | Phase 2 | High | ✅ REST API (MCP connected) |
| Passportal | Phase 3 | Medium | ✅ API Key + HMAC (MCP connected) |
| Scalepad | Phase 3 | Medium | ✅ API Key (MCP connected, partner-only) |

Full integration details: `docs/INTEGRATIONS.md`

---

## ConnectWise Control (ScreenConnect) Integration

- **Server:** `https://control.rxtech.com`
- **Auth:** Basic Auth (Base64 `username:password`) — stored in BFF env vars
- **Purpose:** One-click remote control from ticket right-click menu

### Session GUID Retrieval
- **Endpoint:** `POST /Services/PageService.ashx/GetHostSessionInfo`
- **Body:** `[2, ["All Machines"], "searchFilter", null, limit]` (2 = Access sessions)
- **Returns:** Sessions with GUID, computer name, online status

### Launch URL Pattern
```
https://control.rxtech.com/Host#Access/All%20Machines//<SESSION-GUID>/Join
```

### Data Chain (Ticket → Remote Session)
1. CW Manage ticket → company name
2. Automate API → computers for that company (filtered by `Client.Name`)
3. Control API → match computer name to session GUID
4. Construct launch URL → open in new browser tab

### BFF Environment Variables
```
SCREENCONNECT_BASE_URL=https://control.rxtech.com
SCREENCONNECT_USERNAME=
SCREENCONNECT_PASSWORD=
```

## Unified Authentication Architecture (Decided 2026-03-28)

RX Skin uses a **two-tier auth model** so techs log in once and access all platforms:

### Tier 1: Service Account Credentials (Per-Tenant, Stored in DB)
CW Manage, Automate, Control, Passportal, ScalePad, Datto, Auvik, SentinelOne — all use org-level API keys/tokens. One set per tenant, encrypted with AES-256-GCM in `TenantCredential` table. BFF injects credentials on every API call.

### Tier 2: User-Delegated OAuth2 (Per-User)
Microsoft Graph and Webex require per-user OAuth2 consent. User connects once in Settings → tokens stored encrypted in `UserOAuthToken` table → auto-refreshed by BFF.

### Key Decisions
- **Azure AD as primary IdP** — register one multi-tenant Azure AD app for NextAuth login + Graph API
- **Credential Vault** — all integration credentials stored encrypted in PostgreSQL, resolved by `getTenantCredentials(tenantId, platform)`
- **Graph scopes (delegated):** `Mail.Read Mail.Send Calendars.ReadWrite Presence.Read.All Chat.Read`
- **Webex scopes:** `spark:calling spark:messages_read spark:messages_write spark:people_read spark-admin:calling_cdr_read`
- **CW Home SSO with Azure AD** — recommended to configure so ScreenConnect launch URLs work seamlessly

Full auth architecture: `docs/AUTH_ARCHITECTURE.md`

---

## UI Architecture (Decided 2026-03-28)

### Navigation Pattern
- **Desktop:** Fixed left sidebar (w-64) with department-specific nav items
- **Mobile:** Bottom nav bar (5 main items + search) — stays for primary pages
- **Both:** Persistent top bar with search icon + **UserAvatar dropdown** pinned to top-right
- **UserAvatar dropdown:** Profile & Settings link, Admin Panel link (admin-only), Sign Out
- **Theme toggle:** Moved from sidebar/mobile nav into Settings → Appearance tab

### User Settings Page (`/settings`) — Tabbed Layout
| Tab | Contents |
|-----|----------|
| **Profile** | Avatar, name, email, role, department, CW connection status |
| **Appearance** | Light/dark theme toggle, compact mode, display preferences |
| **Connections** | Connect Microsoft 365 (OAuth2), Connect Webex (OAuth2) — per-user |
| **Notifications** | Email notification prefs, in-app notifications, desktop push, sound alerts |

### Admin Panel (`/admin`) — Admin Role Only
Left sidebar nav within admin section. Orange accent color to distinguish from main UI.

| Section | Route | Purpose |
|---------|-------|---------|
| **Overview** | `/admin` | Dashboard cards linking to all admin sections |
| **Integrations** | `/admin/integrations` | Credential Vault UI — add/edit/test API keys for all 10 platforms (Tier 1 + Tier 2) |
| **Users** | `/admin/users` | User list with role/dept/status, add/edit/disable users, role assignment |
| **Tenant Settings** | `/admin/tenant` | Company info, CW board mappings, cache TTLs, rate limits, database info |
| **AI & Bots** | `/admin/ai` | Configure AI provider + API key, enable/disable bots (RX Assistant, Admin Advisor, Ticket Triage, Insights Engine), chatbot placement options |
| **Analytics** | `/admin/analytics` | Click tracking, scroll depth, heatmaps, dead zone detection, session recording, AI-powered improvement suggestions with approve/reject workflow |
| **Audit Log** | `/admin/audit-log` | All API calls, credential access events, logins, admin actions — filterable |

### AI Integration Architecture
- **AI Provider:** Configurable (Anthropic Claude default, OpenAI optional)
- **AI API key:** Stored encrypted in admin settings, used for all bot features
- **Behavior Analytics → AI Pipeline:** Click tracking, heatmaps, and dead zone data feed into the Admin Advisor bot
- **Admin Advisor workflow:** AI analyzes usage data → generates suggestions → admin reviews → approves/rejects → approved changes can be implemented
- **Chatbot placement options:** Floating bubble (bottom-right), inline in ticket detail sidebar, Ctrl+K natural language integration

---

## Project Structure (Current)

```
rx-skin/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (login, etc.)
│   ├── (dashboard)/              # Protected app pages
│   │   ├── tickets/              # Ticket list + detail
│   │   │   └── [id]/             # Ticket detail (notes, time, remote tools)
│   │   ├── projects/             # ★ Department-aware project views
│   │   ├── schedule/             # Calendar scheduler views
│   │   ├── companies/            # Client company views
│   │   ├── ops/                  # Fleet map, analytics, holds
│   │   ├── settings/             # ★ Tabbed user settings (Profile, Appearance, Connections, Notifications)
│   │   └── admin/                # ★ Admin Panel (admin-only, orange accent)
│   │       ├── integrations/     # Credential Vault UI (10 platforms)
│   │       ├── users/            # User management (roles, depts)
│   │       ├── tenant/           # Tenant config (boards, cache, rate limits)
│   │       ├── ai/               # AI & Bots config (4 bots, chatbot placement)
│   │       ├── analytics/        # Behavior tracking, heatmaps, AI suggestions
│   │       └── audit-log/        # API calls, credential access, login events
│   └── api/                      # BFF API routes
│       ├── auth/                 # NextAuth endpoints
│       ├── tickets/              # Ticket CRUD + notes + time entries
│       ├── projects/             # ★ Project list + detail + update
│       ├── schedule/             # Schedule entries
│       ├── automate/             # CW Automate (RMM) — computers, scripts
│       ├── control/              # ScreenConnect — session GUID + launch URL
│       ├── fleet/                # Samsara fleet data
│       ├── samsara/              # Samsara drivers, vehicles, HOS│       ├── analytics/            # Behavior analytics data
│       ├── members/              # CW member lookup
│       └── search/               # Global search
├── components/                   # Shared UI components
│   ├── dashboard/                # MyDayClient
│   ├── tickets/                  # TicketListClient, TicketDetail, TicketCard, QuickClosePanel
│   ├── projects/                 # ★ ProjectKanban, FinancialTable, PortfolioView, etc.
│   ├── remote/                   # ★ TicketActions, ComputerPicker, SystemInfoPanel, ScriptRunner
│   ├── ops/                      # FleetMap, TechSidebar, AnalyticsDashboard, ScheduleHoldList, etc.
│   ├── department/               # ★ DepartmentProvider context
│   ├── layout/                   # ★ Sidebar, MobileNav, TopBar, UserAvatar, GlobalSearch
│   └── theme/                    # ThemeProvider
├── lib/                          # Utilities and core logic
│   ├── cw/                       # ConnectWise API client + normalizers
│   ├── automate/                 # CW Automate API client
│   ├── control/                  # ScreenConnect API client
│   ├── samsara/                  # Samsara fleet API client
│   ├── cache/                    # BFF cache + deduplication
│   ├── auth/                     # Auth config + credential helpers
│   ├── api/                      # Error handlers
│   ├── fleet/                    # Fleet data merge utilities
│   └── db/                       # Prisma client
├── prisma/                       # Database schema + migrations
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript types (dept codes, projects, tickets, etc.)
├── docs/                         # All project documentation (consolidated)
│   ├── ARCHITECTURE.md           # System architecture
│   ├── AUTH_ARCHITECTURE.md      # Two-tier auth design
│   ├── INTEGRATIONS.md           # Integration specs (CW, Graph, Webex, etc.)
│   ├── API_STRATEGY.md           # API design patterns│   ├── ROADMAP.md                # Feature roadmap
│   ├── CONTRIBUTING.md           # Contribution guidelines
│   ├── DIAGRAMS.md               # Architecture diagrams
│   ├── mockups/                  # ★ Department dashboard mockups (5 JSX files)
│   ├── analysis/                 # ★ Department analysis documents (docx)
│   └── planning/                 # ★ Feature plans and build prompts
├── .env.example                  # Template — never commit .env
└── auth.ts                       # NextAuth v5 re-export (required by middleware)
```

**Workspace Root (`CW- Rx Skin/`)**
```
├── CLAUDE.md                     # THIS FILE — master project doc
├── INSTRUCTIONS.md               # AI session instructions
├── rx-skin/                      # Main Next.js application (above)
├── rx-ops-hub/                   # Separate ops hub project
└── docs/                         # (empty — consolidated into rx-skin/docs/)
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
# Microsoft Graph + Azure AD (multi-tenant app)
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=                    # RX Technology tenant

# Webex
WEBEX_CLIENT_ID=
WEBEX_CLIENT_SECRET=
WEBEX_REDIRECT_URI=https://rxtech.app/api/auth/callback/webex

# ConnectWise Control / ScreenConnect
SCREENCONNECT_BASE_URL=https://control.rxtech.com
SCREENCONNECT_USERNAME=
SCREENCONNECT_PASSWORD=

# Credential Vault Encryption
CREDENTIAL_ENCRYPTION_KEY=             # 256-bit key for AES-256-GCM
```

---

## AI Assistant Rules (Read Every Session)

1. **Always read this file first** before starting any work
2. **Never commit secrets or credentials** — use `.env.local` only
3. **BFF layer is sacred** — CW API calls are always server-side only
4. **Tenant ID must be in every query** — never skip tenant scoping
5. **TypeScript strict mode** — no `any` types without explicit justification
6. **Mobile-first** — every component must work on 375px width7. **Performance budget:** First contentful paint < 1.5s; API calls < 300ms cached
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
| **GitHub** | https://github.com/NBTX77/RxSkin |
| **Vercel** | https://rxtech.app (production) |
| **Supabase / DB** | TBD (Supabase MCP connected, DB not yet created) |

---

## Department-Based Architecture (Decided 2026-03-28)

RX Skin serves 5 departments, each with a tailored dashboard and nav. User's department is determined at login from their CW member `defaultDepartment` field.

| Dept Code | Name | CW Boards | Members | Key Screens |
|-----------|------|-----------|---------|-------------|
| **IT** | MSP & Engineers | Managed Services, Engineering, Alerts/Monitoring, IT Installations | 80 | Tickets, Ticket Kanban, Projects, Fleet Map, Calendar, Alerts, Timer |
| **SI** | Systems Integration | SI (Service), SI (Security), SI (Communication) | 38 | Project Kanban (primary), Service Queue, Job Scheduler, Fleet Map, Materials |
| **AM** | Account Management | Opportunities | 17 | My Accounts, Company 360, Agreements, Opportunity Pipeline, Client Health |
| **GA** | Accounting/Procurement | Procurement | 8 | Invoices, POs, Project Financials, Time & Billing, Agreements, Catalog |
| **LT** | Leadership Team | All boards (cross-dept) | Exec | Exec Dashboard, Project Portfolio, Utilization, Financials, Dept Drill-Down |

### Projects Board (Critical)
- 53 open projects: 23 SI (13,595 budget hrs), 16 IT (154 hrs), 14 G&A (2,467 hrs)
- Projects Board renders differently per department: IT/SI get kanban (work mode), AM gets read-only status, GA gets financial table, LT gets portfolio heatmap
- Project status pipeline: 10 New → 20 Incomplete Handoff → 30 Assigned to PM → 31/33/34 Work Stages → 50 Completed
- All projects use ActualRates billing — time tracking accuracy is critical
- Project-to-ticket linkage must work both directions

### Implementation Phases
- **Phase 1A:** Department routing + IT experience (tickets + projects + timer)
- **Phase 1B:** SI department + full project kanban
- **Phase 2A:** Account Management (Company 360, agreements, opportunities)
- **Phase 2B:** G&A / Accounting (invoices, POs, project financials)
- **Phase 3:** Leadership Dashboard (exec KPIs, portfolio heatmap, utilization)

### Department Mockups
Interactive React mockups in `rx-skin/docs/mockups/`: `mockup-IT-Dashboard.jsx`, `mockup-SI-Dashboard.jsx`, `mockup-AM-Dashboard.jsx`, `mockup-GA-Dashboard.jsx`, `mockup-LT-Dashboard.jsx`

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
- [x] Production build clean (`next build` passes, TypeScript clean)- [x] Vercel MCP connected
- [x] Supabase MCP connected
- [x] Git installed on Windows dev machine
- [x] Code pushed to GitHub (NBTX77/RxSkin)
- [x] Deployed to Vercel — https://rxtech.app (production)
- [x] Login working with Phase 1 demo credentials (admin@rxtech.app / RxSkin2026!)
- [x] Department architecture analysis complete — 5 depts mapped to CW boards/members
- [x] Projects Board deep dive — 53 projects analyzed, status pipeline mapped, per-dept rendering spec
- [x] Department dashboard mockups created (IT, SI, AM, GA, LT)
- [x] ScreenConnect integration researched — control.rxtech.com, GUID retrieval via Control API, launch URL pattern confirmed
- [x] Ticket detail page (`/tickets/[id]`) — notes, time entries, mobile-responsive
- [x] Remote tools built — TicketActions, ComputerPicker, SystemInfoPanel, ScriptRunner components
- [x] Automate BFF routes — `/api/automate/computers`, `/api/automate/scripts` (GET + POST)
- [x] Control BFF route — `/api/control` (session GUID lookup + launch URL)
- [x] Automate + Control API clients — `lib/automate/client.ts`, `lib/control/client.ts`
- [x] Unified auth architecture designed — two-tier model (service accounts + user OAuth2)
- [x] Microsoft Graph + Webex integration researched — scopes, endpoints, multi-tenant Azure AD app
- [x] Auth architecture document written — `docs/AUTH_ARCHITECTURE.md`
- [x] Top bar + UserAvatar dropdown — pinned top-right, profile/settings/admin/sign-out
- [x] Tabbed Settings page — Profile, Appearance (theme toggle), Connections (M365/Webex OAuth), Notifications
- [x] Admin Panel built — layout with sidebar nav + 6 sections
- [x] Admin Integrations — Credential Vault UI for all 10 platforms (Tier 1 + Tier 2)
- [x] Admin Users — user list, role/dept badges, search/filter, add/disable
- [x] Admin Tenant Settings — company info, CW board mappings, cache TTLs, rate limits
- [x] Admin AI & Bots — AI provider config, 4 bots (RX Assistant, Admin Advisor, Ticket Triage, Insights Engine), chatbot placement
- [x] Admin Analytics — click tracking, heatmaps, dead zones, AI improvement suggestions with approve/reject workflow
- [x] Admin Audit Log — API calls, credential access, logins, admin actions with filters- [x] CW API credentials configured in Vercel — CW_BASE_URL, CW_CLIENT_ID, CW_PUBLIC_KEY, CW_PRIVATE_KEY, CW_COMPANY_ID (all environments)
- [x] Auth env vars configured in Vercel — NEXTAUTH_SECRET, AUTH_TRUST_HOST, ADMIN_EMAIL, ADMIN_PASSWORD
- [x] Samsara env vars configured in Vercel — SAMSARA_API_TOKEN, SAMSARA_BASE_URL
- [x] Vercel build passing — `force-dynamic` fix applied to all 18 API routes + dashboard layout (commits c16ab15, ccf0033)
- [x] Notion project hub updated — status, roadmap, accounts registry all current
- [ ] Supabase database created + Prisma migrations run
- [x] ConnectWise API connection tested with live data — validated CW v2025.1 cloud (NA region), 46 active members, 667 projects, live tickets flowing
- [x] Department routing — DepartmentProvider, dept-aware sidebar with per-dept nav, department switcher
- [x] Projects Board — API routes (`/api/projects`, `/api/projects/[id]`), kanban, financial table, portfolio, read-only list, detail overlay
- [x] Department-aware Projects page — renders kanban (IT/SI), financial table (GA), portfolio heatmap (LT), read-only list (AM)
- [ ] Schedule / calendar view (FullCalendar + drag-drop)
- [ ] Credential Vault — migrate env var creds to encrypted DB (`TenantCredential` table)
- [ ] Azure AD multi-tenant app registration + NextAuth provider
- [ ] Microsoft Graph BFF routes (mail, calendar, presence, Teams)
- [ ] Webex BFF routes (messaging, call history, click-to-call, queue stats)
- [ ] User OAuth2 connection flow (Settings → Connect M365 / Connect Webex)
- [ ] CW Home SSO configured with Azure AD as external IdP

## Known Dev Environment Issues

- `next dev` Tailwind CSS broken (PostCSS ESM/CJS conflict) — use `next start` for local review
- `next.config.js` must be CJS format — `.mjs` duplicate deleted
- `AUTH_TRUST_HOST=1` required in `.env.local` for NextAuth v5 localhost
- Stale duplicate config files (`.mjs` and `.ts` variants) have been deleted
- `middleware.ts` exists for route protection — may conflict with Node v24 edge runtime (monitor)
- **All API routes and dashboard layout require `export const dynamic = 'force-dynamic'`** — without this, `next build` fails with DYNAMIC_SERVER_USAGE errors because `auth()` calls `headers()` which prevents static generation. Applied to all 18 API routes + `src/app/(dashboard)/layout.tsx`.

---

*Last updated: 2026-03-28 (Phase 1A complete + CW API live validated + Vercel env vars configured + build fix deployed + Notion synced) — Travis Brown / Claude*