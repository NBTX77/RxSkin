# DIAGRAMS.md — RX Skin Architecture Diagrams

> Mermaid diagrams for the RX Skin system. Render in GitHub, Notion, or any Mermaid-compatible viewer.

---

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph Browser["🖥️ Browser (React App)"]
        UI[Next.js App Router]
        RQ[TanStack Query Cache]
        FC[FullCalendar]
        DND[dnd-kit]
    end

    subgraph BFF["⚙️ BFF Layer (Next.js API Routes - Server Only)"]
        AUTH[Auth Middleware]
        TR[Tenant Resolver]
        CACHE[In-Memory LRU Cache]
        DEDUP[Request Deduplicator]
        RL[Rate Limit Handler]
        NORM[Response Normalizer]
    end

    subgraph DB["🗄️ Database (PostgreSQL)"]
        PRISMA[Prisma ORM]
        RLS[Row-Level Security]
        TABLES[(Tenants · Users · Cache · Audit Log)]
    end

    subgraph EXTERNAL["🌐 External APIs"]
        CW[ConnectWise Manage REST API]
        GRAPH[Microsoft Graph API]
        AUTO[CW Automate RMM]
        AUVIK[Auvik]
        MERAKI[Cisco Meraki]
        DATTO[Datto BCDR]
        WEBEX[Webex Calling]
    end

    UI -->|HTTPS + JWT Cookie| AUTH
    AUTH --> TR
    TR --> CACHE
    CACHE --> DEDUP
    DEDUP --> RL
    RL -->|Credentials Injected Server-Side| CW
    RL --> GRAPH
    RL --> AUTO
    RL --> AUVIK
    RL --> MERAKI
    RL --> DATTO
    RL --> WEBEX
    TR --> PRISMA
    PRISMA --> RLS
    RLS --> TABLES
    NORM -->|Normalized Data| UI
    CW -->|Raw Response| NORM
```

---

## 2. Authentication & Session Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant NA as NextAuth.js
    participant DB as Database
    participant BFF as BFF API Route
    participant CW as ConnectWise API

    U->>NA: POST /api/auth/signin (credentials)
    NA->>DB: Verify user credentials
    DB-->>NA: User + tenantId + role
    NA-->>U: JWT in httpOnly cookie

    Note over U,CW: Authenticated request

    U->>BFF: GET /api/tickets (with JWT cookie)
    BFF->>NA: Validate JWT session
    NA-->>BFF: session { userId, tenantId, role }
    BFF->>DB: Fetch encrypted CW credentials for tenantId
    DB-->>BFF: { cwBaseUrl, cwPublicKey, cwPrivateKey }
    BFF->>CW: GET /service/tickets (with injected auth header)
    CW-->>BFF: Raw ticket data (JSON)
    BFF->>BFF: Normalize response
    BFF-->>U: Clean ticket data (no credentials exposed)
```

---

## 3. Caching Data Flow

```mermaid
flowchart TD
    A([User requests ticket list]) --> B{React Query\nCache Hit?}

    B -->|Yes, < 30s old| C[Return cached data immediately\nNo network call]
    B -->|No / stale| D[Call GET /api/tickets]

    D --> E{BFF In-Memory\nCache Hit?}

    E -->|Yes, < 60s old| F[Return BFF cached data\nNo CW API call]
    E -->|No| G[Call ConnectWise API]

    G --> H{CW Response}
    H -->|200 OK| I[Normalize response\nStore in BFF cache\nReturn to client]
    H -->|429 Rate Limited| J[Read Retry-After header\nQueue retry\nReturn 503 to client]
    H -->|Error| K[Return error to client\nShow stale data if available]

    I --> L[React Query stores in browser cache]
    L --> M([Ticket list renders])

    J --> N[React Query retries after delay]
    N --> D
```

---

## 4. Drag and Drop Scheduling Flow

```mermaid
sequenceDiagram
    participant T as Technician (Browser)
    participant FC as FullCalendar
    participant DND as dnd-kit
    participant RQ as React Query
    participant BFF as /api/schedule
    participant CW as ConnectWise Schedule API

    T->>FC: Drag ticket event to new time slot
    FC->>RQ: Optimistic update (instant UI change)
    RQ->>RQ: Cache updated immediately (perceived instant)
    FC->>BFF: PATCH /api/schedule/{id} { start, end }
    BFF->>CW: PATCH /schedule/entries/{id}

    alt Success
        CW-->>BFF: 200 OK (updated entry)
        BFF-->>RQ: Confirm update
        RQ->>RQ: Invalidate schedule cache
        RQ->>BFF: Refetch schedule for date range
        BFF-->>T: Fresh schedule data
    else CW API Error
        CW-->>BFF: 4xx or 5xx
        BFF-->>RQ: Error response
        RQ->>RQ: Rollback optimistic update
        T->>T: Ticket snaps back to original position
        T->>T: Error toast shown
    end
```

---

## 5. Multi-Tenant Architecture

```mermaid
graph TD
    subgraph Portal["RX Skin Portal (Single Deployment)"]
        APP[Next.js Application]
        MW[Auth Middleware\ntenant resolver]
    end

    subgraph DB["PostgreSQL (Shared, Row-Level Security)"]
        T1[(Tenant: RX Technology)]
        T2[(Tenant: Client A - future)]
        T3[(Tenant: Client B - future)]
        RLS[RLS Policy:\napp.current_tenant]
    end

    subgraph CW_Accounts["ConnectWise Accounts"]
        CW1[CW Account: RX Technology]
        CW2[CW Account: Client A]
        CW3[CW Account: Client B]
    end

    USER1[Tech @ RX Technology] -->|JWT: tenantId=rx-tech| MW
    USER2[Tech @ Client A - future] -->|JWT: tenantId=client-a| MW
    MW -->|SET app.current_tenant| RLS
    RLS --> T1
    RLS --> T2
    RLS --> T3
    MW -->|Inject RX credentials| CW1
    MW -->|Inject Client A credentials| CW2
    MW -->|Inject Client B credentials| CW3
```

---

## 6. Integration Hub — Company Dashboard Data Sources

```mermaid
graph LR
    CO[Company Detail Page]

    subgraph "Phase 1"
        CW_T[CW Tickets]
        CW_S[CW Schedule]
        CW_C[CW Configurations]
    end

    subgraph "Phase 2"
        GRAPH[MS Graph\nUsers & Devices]
        AUTO[CW Automate\nAgent Status]
    end

    subgraph "Phase 3"
        AUVIK[Auvik\nNetwork Health]
        MERAKI[Meraki\nWAN Status]
        DATTO[Datto\nBackup Status]
        FORTINET[Fortinet\nVPN Status]
        WEBEX[Webex\nPhone System]
    end

    subgraph "Phase 4"
        PASSPORT[Passportal\niframe embed]
        SCALEPAD[Scalepad\nWarranty Export]
    end

    CW_T --> CO
    CW_S --> CO
    CW_C --> CO
    GRAPH --> CO
    AUTO --> CO
    AUVIK --> CO
    MERAKI --> CO
    DATTO --> CO
    FORTINET --> CO
    WEBEX --> CO
    PASSPORT --> CO
    SCALEPAD --> CO
```

---

## 7. Database Schema (Core Tables)

```mermaid
erDiagram
    TENANTS {
        uuid id PK
        string name
        string cw_base_url
        string cw_company_id
        text cw_public_key_encrypted
        text cw_private_key_encrypted
        string cw_client_id
        json azure_credentials_encrypted
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    USERS {
        uuid id PK
        uuid tenant_id FK
        string email
        string name
        string role
        string cw_member_id
        timestamp last_login
        timestamp created_at
    }

    TICKET_CACHE {
        uuid id PK
        uuid tenant_id FK
        int cw_ticket_id
        string summary
        string status
        string priority
        string board
        int company_id
        string company_name
        string assigned_to
        json raw_data
        timestamp cw_updated_at
        timestamp cached_at
    }

    AUDIT_LOG {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        string action
        string resource_type
        string resource_id
        json changes
        string ip_address
        timestamp created_at
    }

    USER_SETTINGS {
        uuid id PK
        uuid user_id FK
        string default_board
        string default_view
        string[] notification_prefs
        json ui_preferences
        timestamp updated_at
    }

    TENANTS ||--o{ USERS : "has many"
    TENANTS ||--o{ TICKET_CACHE : "has many"
    TENANTS ||--o{ AUDIT_LOG : "has many"
    USERS ||--|| USER_SETTINGS : "has one"
    USERS ||--o{ AUDIT_LOG : "generates"
```

---

## 8. Git Branch Strategy

```mermaid
gitGraph
    commit id: "Initial scaffold"
    branch develop
    checkout develop
    commit id: "Phase 0 setup"

    branch feat/auth
    checkout feat/auth
    commit id: "NextAuth setup"
    commit id: "JWT with tenantId"
    checkout develop
    merge feat/auth id: "Merge auth"

    branch feat/ticket-list
    checkout feat/ticket-list
    commit id: "BFF /api/tickets"
    commit id: "Ticket list UI"
    commit id: "Mobile layout"
    checkout develop
    merge feat/ticket-list id: "Merge tickets"

    branch feat/create-ticket
    checkout feat/create-ticket
    commit id: "Create ticket form"
    commit id: "Validation + tests"
    checkout develop
    merge feat/create-ticket id: "Merge create"

    checkout main
    merge develop id: "v0.1.0 - Phase 1" tag: "v0.1.0"

    checkout develop
    branch feat/calendar
    checkout feat/calendar
    commit id: "FullCalendar setup"
    commit id: "Drag and drop"
    checkout develop
    merge feat/calendar id: "Merge calendar"

    checkout main
    merge develop id: "v0.2.0 - Phase 2" tag: "v0.2.0"
```

---

## 9. Phase Roadmap Timeline

```mermaid
gantt
    title RX Skin Development Phases
    dateFormat  YYYY-MM-DD
    section Phase 0 — Setup
    Project scaffold           :active, p0a, 2026-03-26, 1w
    GitHub + Notion + Asana    :p0b, after p0a, 3d
    CW API connection test     :p0c, after p0b, 2d

    section Phase 1 — Core Ticketing
    Auth & session             :p1a, after p0c, 1w
    Dashboard home             :p1b, after p1a, 1w
    Ticket list + filters      :p1c, after p1b, 2w
    Ticket detail + edit       :p1d, after p1c, 1w
    Create ticket form         :p1e, after p1d, 1w
    Testing + polish           :p1f, after p1e, 1w

    section Phase 2 — Scheduling
    FullCalendar integration   :p2a, after p1f, 1w
    Drag and drop              :p2b, after p2a, 2w
    Unscheduled queue          :p2c, after p2b, 1w
    M365 integration           :p2d, after p2c, 2w

    section Phase 3 — Company Hub
    Company list + detail      :p3a, after p2d, 2w
    RMM integration (Automate) :p3b, after p3a, 1w
    Network (Auvik/Meraki)     :p3c, after p3b, 2w
    Backup (Datto/Acronis)     :p3d, after p3c, 1w
    Fortinet + Webex           :p3e, after p3d, 2w
```

---

*Last updated: 2026-03-26*
