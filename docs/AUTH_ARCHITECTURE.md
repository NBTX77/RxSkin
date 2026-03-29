# RX Skin — Unified Authentication Architecture

> **Deep dive on single sign-on, credential management, and multi-platform auth for the RX Skin dashboard.**
> Last updated: 2026-03-28

---

## The Goal

A technician logs into RX Skin **once per day** and immediately has access to every integrated platform — ConnectWise Manage, Automate, Control, Passportal, ScalePad, Datto, Auvik, SentinelOne, Microsoft 365, and Webex — without entering credentials for each service individually.

---

## Platform Auth Mechanisms (Current State)

Every platform RX Skin integrates with uses a different authentication model. There is no universal SSO standard across MSP tools — the unified experience must be built in the BFF layer.

| Platform | Auth Type | Token Lifetime | Service Account? | Per-User Delegation? |
|----------|-----------|----------------|-------------------|---------------------|
| **CW Manage** | API Key (Basic Auth) | Never expires | ✅ Yes — API member account | ❌ API keys are global |
| **CW Automate** | OAuth2 Client Credentials | ~55 min token | ✅ Yes | ❌ Token = full access |
| **CW Control** | Basic Auth (legacy) / OAuth2+SAML | Session-based | ✅ Yes | ✅ With SAML/OAuth2 |
| **Passportal** | API Key + HMAC Token | Per-request HMAC | ✅ Yes | ❌ Org-level keys |
| **ScalePad** | API Key (Bearer) | 2-year expiry | ✅ Yes | ❌ Partner-only API |
| **Datto BCDR** | API Key (Public/Private) | Never expires | ✅ Yes | ❌ Org-level keys |
| **Auvik** | Basic Auth (user + API key) | Never expires | ✅ Yes | ✅ Per-user API keys |
| **SentinelOne** | Bearer Token (API Token) | 30-day expiry | ✅ Yes | ✅ Per-user tokens |
| **Microsoft Graph** | OAuth2 (MSAL) | ~1hr access / 90-day refresh | ✅ App-only | ✅ Delegated flow |
| **Webex** | OAuth2 | ~14-day access / 90-day refresh | ✅ Service Apps | ✅ User integrations |

### Key Insight

Most MSP tools (CW Manage, Automate, Passportal, ScalePad, Datto, Auvik) use **service account / API key patterns** — one set of credentials per tenant, stored server-side. Only Microsoft Graph and Webex support true per-user OAuth2 delegation.

This means "single sign-on" for RX Skin is actually two patterns working together:

1. **User authenticates to RX Skin** → NextAuth session with JWT
2. **BFF injects the correct service credentials** per tenant per integration on every API call

The user never sees or touches the integration credentials. They log in once, and the BFF handles everything.

---

## Architecture: The Credential Vault

### Overview

```
User (Browser)
    │
    ▼
NextAuth v5 Login (email/password or Azure AD SSO)
    │
    ▼ JWT with { userId, tenantId, department, email }
    │
Next.js API Routes (BFF)
    │
    ├── getTenantCredentials(tenantId, 'connectwise')
    ├── getTenantCredentials(tenantId, 'automate')
    ├── getTenantCredentials(tenantId, 'control')
    ├── getTenantCredentials(tenantId, 'passportal')
    ├── getTenantCredentials(tenantId, 'scalepad')
    ├── getTenantCredentials(tenantId, 'datto')
    ├── getTenantCredentials(tenantId, 'auvik')
    ├── getTenantCredentials(tenantId, 'sentinelone')
    ├── getUserGraphToken(userId)         ← per-user OAuth2
    └── getUserWebexToken(userId)         ← per-user OAuth2
         │
         ▼
    External APIs (CW, Automate, Graph, Webex, etc.)
```

### Database Schema (Prisma)

```prisma
model Tenant {
  id              String   @id @default(uuid())
  name            String
  slug            String   @unique
  createdAt       DateTime @default(now())

  credentials     TenantCredential[]
  users           User[]
}

model TenantCredential {
  id              String   @id @default(uuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])

  platform        String   // 'connectwise' | 'automate' | 'control' | 'passportal' | etc.

  // Encrypted with AES-256-GCM (existing pattern in lib/auth/credentials.ts)
  encryptedData   String   // JSON blob: { baseUrl, publicKey, privateKey, ... }
  iv              String
  tag             String

  isActive        Boolean  @default(true)
  lastVerified    DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([tenantId, platform])
  @@index([tenantId])
}

model UserOAuthToken {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])

  provider        String   // 'microsoft' | 'webex'

  // Encrypted
  accessToken     String
  refreshToken    String
  expiresAt       DateTime
  scopes          String   // space-separated scopes granted

  iv              String
  tag             String

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, provider])
  @@index([userId])
}
```

### Credential Resolution Flow

```typescript
// lib/auth/credential-vault.ts

type Platform =
  | 'connectwise' | 'automate' | 'control'
  | 'passportal' | 'scalepad' | 'datto'
  | 'auvik' | 'sentinelone'

interface PlatformCredentials {
  connectwise: { baseUrl: string; companyId: string; publicKey: string; privateKey: string; clientId: string }
  automate:    { baseUrl: string; username: string; password: string }
  control:     { baseUrl: string; username: string; password: string }
  passportal:  { baseUrl: string; apiKey: string }
  scalepad:    { apiKey: string }
  datto:       { baseUrl: string; publicKey: string; privateKey: string }
  auvik:       { baseUrl: string; username: string; apiKey: string }
  sentinelone: { baseUrl: string; apiToken: string }
}

async function getTenantCredentials<P extends Platform>(
  tenantId: string,
  platform: P
): Promise<PlatformCredentials[P]> {
  // 1. Check in-memory cache (30s TTL)
  // 2. Query TenantCredential table
  // 3. Decrypt with AES-256-GCM
  // 4. Return typed credentials
}
```

---

## Two-Tier Auth: Service Accounts + User Delegation

### Tier 1: Service Account Credentials (Per-Tenant)

These platforms use org-level API keys. One set of credentials per tenant, stored in `TenantCredential` table, never exposed to the browser.

| Platform | Credential Shape | How It's Used |
|----------|-----------------|---------------|
| CW Manage | `{ baseUrl, companyId, publicKey, privateKey, clientId }` | Basic Auth header on every CW API call |
| CW Automate | `{ baseUrl, username, password }` | OAuth2 token exchange → Bearer token (cached 55min) |
| CW Control | `{ baseUrl, username, password }` | Basic Auth for session GUID retrieval |
| Passportal | `{ baseUrl, apiKey }` | HMAC signature generated per-request |
| ScalePad | `{ apiKey }` | `x-api-key` header |
| Datto BCDR | `{ baseUrl, publicKey, privateKey }` | Basic Auth header |
| Auvik | `{ baseUrl, username, apiKey }` | Basic Auth header |
| SentinelOne | `{ baseUrl, apiToken }` | `ApiToken` Bearer header (refresh every 25 days) |

### Tier 2: User-Delegated OAuth2 (Per-User)

Microsoft Graph and Webex require per-user authentication because the user's identity determines what data they can access (their mailbox, their calendar, their Teams chats, their Webex spaces).

**Flow:**

1. User logs into RX Skin (NextAuth session created)
2. User clicks "Connect Microsoft 365" in Settings → OAuth2 redirect to Azure AD
3. User grants consent → authorization code returned to RX Skin callback
4. BFF exchanges code for access + refresh tokens → stored encrypted in `UserOAuthToken`
5. On subsequent requests, BFF uses stored tokens (auto-refreshes if expired)
6. Same flow for Webex

**This is a one-time setup per user per provider.** After initial consent, tokens refresh silently. The user never re-authenticates unless they revoke access or the refresh token expires (90 days for Graph, 90 days for Webex).

---

## Microsoft Graph Integration Design

### Azure AD App Registration

Register **one multi-tenant Azure AD app** in the RX Technology tenant:

- **Supported account types:** "Accounts in any organizational directory (Multitenant)"
- **Redirect URI:** `https://rxtech.app/api/auth/callback/microsoft`
- **Client credentials:** Generate a client secret (store in BFF env vars)

This single app registration works for RX Technology internally and for future client tenants. Each client's Azure AD admin grants consent once via admin consent URL.

### Scopes (Delegated)

```
openid profile email offline_access
Mail.Read Mail.Send
Calendars.Read Calendars.ReadWrite
Presence.Read.All
Chat.Read
OnlineMeetings.ReadWrite
```

### BFF Routes

| Route | Purpose | Permission Type |
|-------|---------|----------------|
| `GET /api/graph/mail` | User's inbox (recent, unread, filtered) | Delegated — user's mailbox |
| `POST /api/graph/mail/send` | Send email on behalf of user | Delegated — Mail.Send |
| `GET /api/graph/calendar` | User's calendar events | Delegated — Calendars.Read |
| `POST /api/graph/calendar/events` | Create meeting/event | Delegated — Calendars.ReadWrite |
| `GET /api/graph/presence` | Team member presence status | Delegated — Presence.Read.All |
| `GET /api/graph/teams/chats` | Recent Teams chats | Delegated — Chat.Read |

### Token Management

```typescript
// lib/graph/client.ts

import { ConfidentialClientApplication } from '@azure/msal-node'

const msalClient = new ConfidentialClientApplication({
  auth: {
    clientId: process.env.AZURE_AD_CLIENT_ID!,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
    authority: 'https://login.microsoftonline.com/common', // multi-tenant
  },
})

async function getGraphToken(userId: string): Promise<string> {
  // 1. Load encrypted tokens from UserOAuthToken table
  // 2. Check if access token is expired
  // 3. If expired, use MSAL to refresh via refresh token
  // 4. Store updated tokens back to DB
  // 5. Return valid access token
}

async function graphFetch<T>(userId: string, endpoint: string): Promise<T> {
  const token = await getGraphToken(userId)
  const res = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new GraphApiError(res.status, await res.text())
  return res.json()
}
```

### Rate Limits

- Global: 130,000 requests / 10 seconds per app
- Mail: ~16 requests/second per mailbox (target 5-10 rps)
- Teams: 4 requests/second per team
- Throttled requests return `429` with `Retry-After` header

---

## Webex Integration Design

### Webex App Registration

Create a **Webex Integration** (not a bot) in the Webex Developer Portal:

- **Redirect URI:** `https://rxtech.app/api/auth/callback/webex`
- **Scopes:** `spark:calling spark:messages_read spark:messages_write spark:rooms_read spark:people_read spark:meetings_read spark-admin:telephony_config_read spark-admin:calling_cdr_read`

For organization-wide data (call history, queue stats), also create a **Webex Service App** with admin scopes. This runs as a machine account separate from user auth.

### Two Access Patterns

| Pattern | Use Case | Auth |
|---------|----------|------|
| **User Integration** | Messaging, presence, user call history | Per-user OAuth2 token |
| **Service App** | Org-wide CDR, queue stats, auto-attendants | Service app client credentials |

### BFF Routes

| Route | Purpose | Auth Pattern |
|-------|---------|-------------|
| `GET /api/webex/messages` | User's recent Webex messages | User OAuth2 |
| `POST /api/webex/messages` | Send Webex message | User OAuth2 |
| `GET /api/webex/presence` | Team member presence | User OAuth2 |
| `GET /api/webex/calls/history` | Org call history (CDR) | Service App |
| `GET /api/webex/calls/queues` | Call queue status | Service App |
| `GET /api/webex/calls/queues/:id/stats` | Queue analytics | Service App |
| `POST /api/webex/calls/dial` | Click-to-call | User OAuth2 |
| `GET /api/webex/meetings` | User's meetings | User OAuth2 |

### Token Management

```typescript
// lib/webex/client.ts

async function getWebexToken(userId: string): Promise<string> {
  // Same pattern as Graph — load from UserOAuthToken, refresh if expired
  // Webex refresh endpoint: POST https://webexapis.com/v1/access_token
  //   grant_type=refresh_token, refresh_token, client_id, client_secret
}

// Service app token (org-wide, tenant-level)
async function getWebexServiceToken(tenantId: string): Promise<string> {
  // Load service app credentials from TenantCredential
  // Exchange for token via client credentials flow
}
```

### Rate Limits

- General: ~300 requests/minute per user
- CDR: 1 request/minute per org (cache aggressively — 5-minute TTL minimum)
- Webhooks: Near real-time delivery, implement idempotency

---

## ConnectWise Unified SSO (Bonus)

ConnectWise offers its own SSO through **CW Home** that federates across Manage, Automate, and Control. If RX Technology configures CW Home SSO with Azure AD as the external IdP, then:

1. User logs into RX Skin via Azure AD (NextAuth)
2. RX Skin BFF uses service account API keys for CW Manage/Automate (no user-level auth needed)
3. ScreenConnect launch URLs open in browser where user is already SSO'd into Control via Azure AD
4. Result: truly seamless experience — one Azure AD login covers everything

This is the recommended path. Configure Azure AD as the IdP for CW Home, then all CW products respect that session.

---

## User Experience Flow

### First-Time Setup (Admin)

1. Admin logs into RX Skin
2. Goes to Settings → Integrations
3. For each platform, enters the service account credentials (API keys, etc.)
4. Credentials are encrypted and stored in `TenantCredential` table
5. Admin clicks "Test Connection" for each — BFF validates credentials

### First-Time Setup (User)

1. User logs into RX Skin (email/password or Azure AD SSO)
2. Banner prompts: "Connect your Microsoft 365 account for email and calendar"
3. User clicks → OAuth2 redirect → grants consent → tokens stored
4. Same for Webex: "Connect Webex for calling and messaging"
5. Done. Never asked again unless tokens expire.

### Daily Experience

1. User opens RX Skin → logs in (or already has valid session cookie)
2. Dashboard loads with data from all platforms:
   - Tickets from CW Manage (service account)
   - Computer status from Automate (service account)
   - Inbox preview from Outlook (user's Graph token)
   - Upcoming meetings from Calendar (user's Graph token)
   - Presence indicators from Teams (user's Graph token)
   - Recent Webex messages (user's Webex token)
   - Call queue stats (Webex service app)
   - Security alerts from SentinelOne (service account)
3. All API calls happen server-side in BFF — zero credentials in the browser

---

## Environment Variables

```env
# === NextAuth ===
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://rxtech.app

# === Azure AD (for NextAuth + Graph) ===
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=                    # RX Technology tenant (multi-tenant app)

# === Webex ===
WEBEX_CLIENT_ID=
WEBEX_CLIENT_SECRET=
WEBEX_REDIRECT_URI=https://rxtech.app/api/auth/callback/webex

# === Database (stores all tenant + user credentials) ===
DATABASE_URL=

# === Encryption Key (for credential vault) ===
CREDENTIAL_ENCRYPTION_KEY=             # 256-bit key for AES-256-GCM
```

All per-tenant and per-user credentials live in the database, encrypted. Only the master encryption key and the Azure AD / Webex app credentials live in env vars.

---

## Security Considerations

1. **Credentials never reach the browser.** Every integration call goes through the BFF.
2. **AES-256-GCM encryption at rest.** All stored credentials are encrypted with a master key.
3. **Tenant isolation.** Every query includes `tenantId`. PostgreSQL RLS as a second layer.
4. **Token refresh is server-side.** Expired OAuth2 tokens are refreshed in the BFF, never by the client.
5. **Audit logging.** Every credential access and API call is logged with `{ tenantId, userId, platform, endpoint, timestamp }`.
6. **Credential rotation.** SentinelOne tokens (30-day) and Azure AD secrets require periodic rotation. Build admin alerts.
7. **Principle of least privilege.** Graph scopes are delegated (user's own data only). Service accounts use minimum required API permissions.

---

## Implementation Phases

| Phase | What | When |
|-------|------|------|
| **1A (Now)** | NextAuth login + CW Manage/Automate/Control service account credentials via env vars | Current |
| **1B** | Credential Vault — migrate from env vars to encrypted DB storage | Next |
| **2A** | Microsoft Graph OAuth2 — Outlook mail + calendar + presence in dashboard | Phase 2 |
| **2B** | Webex OAuth2 — messaging + call history + click-to-call | Phase 2 |
| **2C** | Passportal, ScalePad, Datto, Auvik, SentinelOne service accounts in vault | Phase 2 |
| **3** | Admin Settings UI — "Integrations" page for managing all credentials | Phase 3 |
| **4** | Multi-tenant — per-tenant credential isolation, client-facing portal | Phase 4 |

---

*This document is the authoritative reference for RX Skin authentication architecture. Update it as decisions are made.*
