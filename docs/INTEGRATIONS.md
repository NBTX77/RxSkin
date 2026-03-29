# INTEGRATIONS.md — RX Skin Integration Reference

> Living document. Every integration gets a section. Keep API notes, endpoint references, auth details, and known quirks here.

---

## Integration Status Overview

| Platform | Phase | API Available | Auth Method | Notes |
|----------|-------|--------------|-------------|-------|
| ConnectWise Manage | 1 | ✅ REST | API Key | Core platform |
| Microsoft Graph (M365) | 2 | ✅ REST | OAuth 2.0 Client Credentials | Multi-tenant per client |
| ConnectWise Automate | 2 | ✅ REST | API Key / OAuth | RMM data |
| Auvik | 3 | ✅ REST | Basic Auth (API token) | Network topology |
| Cisco Meraki | 18 | ✅ REST | Bearer token (API Key) | Network/wifi/devices/alerts/licensing |
| Datto BCDR | 3 | ✅ REST | API Key | Backup status |
| Acronis | 3 | ✅ REST | OAuth 2.0 | Backup status |
| Fortinet FortiGate | 3 | ✅ REST | API Key | Firewall status |
| Webex (Cisco) | 3 | ✅ REST | OAuth 2.0 | Phone system + calling |
| Passportal | 4 | ❌ No public API | iframe embed | Password vault |
| Scalepad | 4 | ❌ No public API | Data export sync | Asset lifecycle |
| SmileBack | 17 | ✅ REST | API Key | CSAT/NPS customer satisfaction |

---

## ConnectWise Manage

### Overview
ConnectWise Manage is the core platform. All ticket, scheduling, company, and time data flows through this API.

### Authentication
- **Method:** HTTP Basic Auth with Base64-encoded `publicKey:privateKey`
- **Header:** `Authorization: Basic <base64(companyId+publicKey:privateKey)>`
- **Client ID:** Required header `clientId` — register at developer.connectwise.com
- **Credentials:** Stored encrypted in `tenants` table, injected by BFF middleware

```typescript
// lib/cw/client.ts
const authHeader = Buffer.from(
  `${companyId}+${publicKey}:${privateKey}`
).toString('base64');

const headers = {
  'Authorization': `Basic ${authHeader}`,
  'clientId': clientId,
  'Content-Type': 'application/json',
};
```

### Rate Limits
- ~40 requests/second per API member
- HTTP 429 returned when exceeded — includes `Retry-After` header
- BFF cache reduces actual API calls dramatically
- For 6-15 users: in-memory cache with 30-60s TTL is sufficient

### Key Endpoints

#### Service Tickets
```
GET    /service/tickets               List tickets (paginated, filterable)
GET    /service/tickets/{id}          Single ticket detail
POST   /service/tickets               Create ticket
PATCH  /service/tickets/{id}          Update ticket (partial)
DELETE /service/tickets/{id}          Delete ticket
GET    /service/tickets/{id}/notes    Ticket notes
POST   /service/tickets/{id}/notes    Add note
GET    /service/tickets/{id}/timeEntries  Time on ticket
POST   /service/tickets/bulk          Bulk update tickets
```

**Key query params for ticket list:**
```
conditions=status/name="New" AND board/id=1
orderBy=lastUpdated desc
pageSize=50
page=1
fields=id,summary,status,priority,company,contact,assignedTo,lastUpdated
```

#### Schedule Entries
```
GET    /schedule/entries              List schedule entries
GET    /schedule/entries/{id}         Single entry
POST   /schedule/entries             Create schedule entry
PATCH  /schedule/entries/{id}         Update (reschedule)
DELETE /schedule/entries/{id}         Remove from schedule
GET    /schedule/types               Available schedule types
GET    /schedule/statuses            Available statuses
```

#### Companies & Contacts
```
GET    /company/companies            List companies
GET    /company/companies/{id}       Company detail
GET    /company/contacts             List contacts
GET    /company/contacts/{id}        Contact detail
GET    /company/contacts/{id}/communications  Contact methods
```

#### Time Entries
```
GET    /time/entries                 List time entries
POST   /time/entries                 Log time
PATCH  /time/entries/{id}            Update time entry
DELETE /time/entries/{id}            Delete time entry
```

#### Configurations (Assets)
```
GET    /system/configurations        List configurations
GET    /system/configurations/{id}   Asset detail
POST   /system/configurations        Create configuration
PATCH  /system/configurations/{id}   Update asset
```

#### Members (Technicians)
```
GET    /system/members               List all members (techs)
GET    /system/members/{identifier}  Member detail + skills
```

### Pagination
CW paginates at 50 records by default, max 1000. Use `page` and `pageSize` params. Always check response count; if `pageSize` records returned, there may be more pages.

### Known Quirks
- `conditions` filter syntax is non-standard — uses CW's own query language
- Dates must be formatted as ISO 8601: `2026-03-26T00:00:00Z`
- The `fields` param dramatically reduces response size — always specify it
- `PATCH` uses JSON Patch operations, not standard partial update
- Some endpoints require `pageSize=1000` workaround for "get all" scenarios
- Member authentication vs API member authentication behave differently

---

## Microsoft Graph (M365)

### Overview
Used for M365 tenant management per client: users, devices, licenses, and Microsoft Teams. Each client has their own Azure AD tenant, requiring per-tenant OAuth credentials.

### Authentication
- **Method:** OAuth 2.0 Client Credentials flow (application permissions)
- **Scope:** `https://graph.microsoft.com/.default`
- **Token endpoint:** `https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token`
- **Credentials per client:** `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`
- Token TTL: 3600s — cache tokens and refresh proactively

```typescript
// lib/graph/auth.ts
async function getGraphToken(azureTenantId: string): Promise<string> {
  // Check token cache first
  const cached = tokenCache.get(azureTenantId);
  if (cached && cached.expiresAt > Date.now() + 60000) return cached.token;

  const response = await fetch(
    `https://login.microsoftonline.com/${azureTenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    }
  );
  // Store and return token
}
```

### Rate Limits
- Microsoft uses adaptive throttling (no fixed published limits)
- Practical: ~4 sustained req/sec per app, burst to 12 req/sec
- Use batch endpoint (up to 20 requests per batch) to reduce throttling
- Always respect `Retry-After` header on 429 responses
- Service-specific limits differ (e.g., Mail is more restrictive than Users)

### Key Endpoints

#### Users
```
GET    /users                        List all users in tenant
GET    /users/{id}                   User detail
PATCH  /users/{id}                   Update user
POST   /users                        Create user
DELETE /users/{id}                   Delete/disable user
GET    /users/{id}/licenseDetails    User's assigned licenses
POST   /users/{id}/assignLicense     Assign/remove licenses
GET    /users?$filter=accountEnabled eq true   Active users only
```

#### Devices (Intune)
```
GET    /deviceManagement/managedDevices              All managed devices
GET    /deviceManagement/managedDevices/{id}         Device detail
POST   /deviceManagement/managedDevices/{id}/remoteLock    Lock device
POST   /deviceManagement/managedDevices/{id}/retire        Retire device
GET    /deviceManagement/deviceCompliancePolicies    Compliance policies
```

#### Licenses (Subscriptions)
```
GET    /subscribedSkus               License SKUs + usage counts
GET    /users/{id}/licenseDetails    Per-user license assignments
```

#### Batch Requests
```
POST   /$batch

// Body: up to 20 individual requests
{
  "requests": [
    { "id": "1", "method": "GET", "url": "/users" },
    { "id": "2", "method": "GET", "url": "/subscribedSkus" }
  ]
}
```

### Required App Permissions (Minimum Viable)
```
User.Read.All
Device.Read.All
DeviceManagementManagedDevices.Read.All
Organization.Read.All
Directory.Read.All
```

---

## ConnectWise Automate (RMM)

### Overview
CW Automate provides RMM (Remote Monitoring and Management) data: agent status, patch compliance, script execution, alerting. Phase 2 integration.

### Authentication
- **Method:** OAuth 2.0 or API Key depending on version
- **Base URL:** `https://[your-automate-server]/cwa/api/v1/`
- **Header:** `Authorization: Bearer {token}` or `CWAImpersonation: {token}`

### Key Endpoints
```
GET    /computers                    List managed computers
GET    /computers/{id}               Computer detail (OS, agent version, last seen)
GET    /computers/{id}/patches       Patch status for machine
GET    /alerts                       Active alerts
GET    /alerts/{id}                  Alert detail
POST   /scripts/{id}/run             Execute script on computer
GET    /groups                       Automate computer groups
GET    /clients                      Client list (maps to CW companies)
```

### Integration Strategy
- Map CW Automate `clientId` → ConnectWise `companyId` (maintain lookup table)
- Show agent status inline on ConnectWise company page
- Surface active alerts as notification badges in portal
- Allow script execution from portal (Phase 2 feature)

---

## Auvik (Network Monitoring)

### Overview
Auvik provides network topology, device discovery, and traffic monitoring. REST API is well-documented.

### Authentication
- **Method:** HTTP Basic Auth
- **Username:** Your Auvik username (email)
- **Password:** Auvik API token (generated in Auvik portal)
- **Base URL:** `https://auvikapi.us1.my.auvik.com/v1/` (or `eu1` for EU customers)

### Key Endpoints
```
GET    /inventory/device/info        List all discovered devices
GET    /inventory/device/info/{id}   Device detail
GET    /inventory/network/info       Network list
GET    /inventory/interface/info     Interface list
GET    /statistics/device/availability   Device availability stats
GET    /statistics/network/traffic   Traffic data
GET    /alert/history/info           Alert history
GET    /tenants                      List Auvik tenants (client orgs)
```

### Integration Strategy
- Surface device count and alert count on company page
- "View in Auvik" deep link for network topology
- Alert badges in portal when Auvik detects issues

---

## Cisco Meraki (Phase 18)

### Overview
Cisco Meraki provides cloud-managed networking: switches (MS), access points (MR), security appliances (MX), cameras (MV), and sensors (MT). The Dashboard API v1 is a RESTful API for programmatic management and monitoring at scale. For MSPs, a single API key grants access to all managed customer organizations.

**Meraki Org:** Rx Technology (ID: `718324140565595403`)
**Networks:** "Lab" + "RX Technology" (103 clients, 1.15 TB usage)

### Authentication
- **Method:** Bearer token in `Authorization` header
- **Header:** `Authorization: Bearer {MERAKI_API_KEY}`
- **Base URL:** `https://api.meraki.com/api/v1/`
- **MSP pattern:** One API key covers ALL organizations the admin manages
- **Key generation:** Meraki Dashboard → Organization → API & Webhooks → API keys tab → Generate
- **Note:** SAML-authenticated admins cannot generate API keys — requires local (non-SAML) admin account

### Rate Limits
| Limit | Value | Notes |
|-------|-------|-------|
| Sustained rate | 10 req/sec per org | Hard limit across all API clients for that org |
| Burst allowance | +10 extra in first second | Total of 30 requests in 2 seconds |
| Per-source-IP | 100 req/sec global | Shared across all API clients from same IP |
| Webhook alerts | 25 per 10 min per event type per network | Excess alerts logged but not delivered |

**429 Handling:** Read `Retry-After` header (seconds), implement exponential backoff, cap at 10 min.

### Pagination
- **Standard:** RFC 5988 Link headers (cursor-based), NOT JSON body metadata
- **Parameters:** `perPage` (max varies by endpoint), `startingAfter`, `endingBefore`
- **Parse pattern:** Extract `rel="next"` URL from `Link` response header
- **Known limits:** Devices: perPage max 1000, Networks: max 50, Clients: max 100

### Key Endpoints

**Organization-Level (most efficient for MSP dashboards):**
```
GET    /organizations                              List all accessible orgs
GET    /organizations/{orgId}                      Single org details
GET    /organizations/{orgId}/networks             Networks in org
GET    /organizations/{orgId}/devices              All devices in org (paginated)
GET    /organizations/{orgId}/devices/statuses     Device health (online/offline/alerting/dormant)
GET    /organizations/{orgId}/appliance/uplinks/statuses   WAN uplink status (MX/Z devices)
GET    /organizations/{orgId}/alerts               Recent alerts
GET    /organizations/{orgId}/licenses             License state + expiration
GET    /organizations/{orgId}/firmware/upgrades     Firmware upgrade status
GET    /organizations/{orgId}/vpnStatuses          Site-to-site VPN peer status
GET    /organizations/{orgId}/configurationChanges Change log (audit trail)
GET    /organizations/{orgId}/switch/ports/statuses All switch ports in org (bulk)
```

**Network-Level:**
```
GET    /networks/{networkId}/clients               Connected clients (with usage)
GET    /networks/{networkId}/wireless/ssids         SSIDs on network
GET    /networks/{networkId}/wireless/connectionStats  Wireless connection stats
GET    /networks/{networkId}/wireless/failedConnections Failed connection events
GET    /networks/{networkId}/wireless/clientCountHistory Client count over time
```

**Device-Level:**
```
GET    /devices/{serial}                           Single device detail
GET    /devices/{serial}/switch/ports/statuses     Switch port statuses
GET    /devices/{serial}/lldp/cdp                  LLDP/CDP neighbor info
GET    /devices/{serial}/clients                   Clients on specific device
```

### Data Model

**Device Status Values:** `online`, `alerting`, `offline`, `dormant`

**Uplink Status Values:** `active`, `ready`, `connecting`, `not connected`, `failed`

**License States:** `active`, `expired`, `recentlyQueued`, `unusedActive`, `unused`

**Product Types:** `appliance`, `switch`, `wireless`, `camera`, `sensor`, `cellularGateway`

### Webhook Events
- **Endpoint:** `POST /api/meraki/webhooks` (BFF receiver)
- **Verification:** HMAC-SHA256 signature in request header, verified against `MERAKI_WEBHOOK_SECRET`
- **Key alert types:** `device_went_offline`, `device_came_online`, `vpn_connectivity_change`, `rogue_ap_detected`, `new_dhcp_lease`, `settings_changed`, `uplink_status_changed`, `sensor_alert`
- **Rate limit:** 25 alerts per 10 min per event type per network (deduplicated)

### Integration Strategy (Phase 18 — IT Department Dashboard)

**10 Dashboard Views:**
1. **Overview** — Device health donut (online/offline/alerting), devices by product type, org cards
2. **Devices** — Searchable table across all orgs: name, model, serial, network, status, IP, firmware
3. **Networks** — Network cards grouped by org: product types, device count, client count
4. **Alerts** — Reverse-chronological alert feed, filterable by type/org/time
5. **WAN** — Uplink status table: WAN1/WAN2/Cellular, public IP, ISP, failover detection
6. **Wireless** — Per-network SSID stats, connection success rate, client count trends
7. **Licensing** — License table with expiration highlighting (red=expired, amber=30 days)
8. **Device Detail Overlay** — Switch: port statuses; Appliance: uplink detail; AP: SSID/client info
9. **Network Detail** — Drill-down: device list, top clients by usage, wireless connection health
10. **Org Selector** — Filter all views to single org or "All Organizations" aggregate

**Cross-CW Integration:**
- Map Meraki `organizationId` → ConnectWise `companyId` for client-level network health
- Surface WAN uplink alerts as priority indicators on company dashboard
- Link device alerts to CW ticket creation

### BFF Routes (14 endpoints)
```
GET    /api/meraki/organizations                      All orgs (cached 1hr)
GET    /api/meraki/organizations/[orgId]/devices       Device statuses
GET    /api/meraki/organizations/[orgId]/networks      Networks
GET    /api/meraki/organizations/[orgId]/uplinks       Appliance uplink statuses
GET    /api/meraki/organizations/[orgId]/alerts        Recent alerts
GET    /api/meraki/organizations/[orgId]/licensing     License state
GET    /api/meraki/organizations/[orgId]/firmware      Firmware upgrade status
GET    /api/meraki/organizations/[orgId]/vpn           VPN peer statuses
GET    /api/meraki/organizations/[orgId]/changelog     Change log entries
GET    /api/meraki/networks/[networkId]/clients        Connected clients
GET    /api/meraki/networks/[networkId]/wireless       Wireless connection stats
GET    /api/meraki/devices/[serial]/ports              Switch port statuses
GET    /api/meraki/devices/[serial]/detail             Single device detail
GET    /api/meraki/dashboard                           Aggregated dashboard data (all orgs)
POST   /api/meraki/webhooks                            Webhook receiver
```

### Cache TTLs
| Data | TTL | Reason |
|------|-----|--------|
| Organizations | 1 hour | Rarely change |
| Device statuses | 5 min | Core health data |
| Uplinks | 5 min | WAN health critical |
| Alerts | 2 min | Time-sensitive |
| Networks | 15 min | Moderate change rate |
| Licensing | 24 hours | Very stable |
| Firmware | 1 hour | Stable |
| Clients | 5 min | Dynamic |

### Environment Variables
```
MERAKI_API_KEY=                    # Meraki Dashboard API key (Bearer token)
MERAKI_WEBHOOK_SECRET=             # Shared secret for webhook signature verification
```

### Known Quirks
1. **SAML admin restriction** — SAML-authenticated dashboard admins cannot generate API keys; need local admin account
2. **Link header pagination** — Uses HTTP Link headers (RFC 5988), NOT JSON body — must parse response headers
3. **Endpoint hierarchy** — Some endpoints are org-level, some network-level, some device-level; org-level is most efficient for MSP bulk queries
4. **Async action batches** — Some write operations return batch IDs that must be polled for status
5. **Rate limit per-org** — 10 req/sec is per org, not global; 50 orgs × 10 = 500 req/sec possible if staggered
6. **Device serial format** — Serials are like `Q2XX-XXXX-XXXX`; always use as string, never parse
7. **Timestamps** — All UTC ISO 8601; store as-is, convert on display
8. **Download URLs** — Some file/snapshot endpoints return temporary pre-signed URLs (similar to Graph `@microsoft.graph.downloadUrl`)

---

## Datto BCDR

### Overview
Datto provides backup and disaster recovery. API exposes device and backup job status.

### Authentication
- **Method:** HTTP Basic Auth
- **Username:** Your Datto API public key
- **Password:** Your Datto API secret key
- **Base URL:** `https://api.datto.com/v1/`

### Key Endpoints
```
GET    /bcdr/device                  List all Datto devices
GET    /bcdr/device/{serialNumber}   Device detail + status
GET    /bcdr/device/{serialNumber}/asset  Asset/backup info
```

### Backup Status Mapping
```typescript
type BackupStatus = 'good' | 'warning' | 'critical' | 'unknown';

function mapDattoStatus(lastBackup: string, issues: DattoIssue[]): BackupStatus {
  const hoursSinceBackup = (Date.now() - new Date(lastBackup).getTime()) / 3600000;
  if (issues.some(i => i.errorType === 'critical')) return 'critical';
  if (hoursSinceBackup > 48) return 'critical';
  if (hoursSinceBackup > 24) return 'warning';
  return 'good';
}
```

### Integration Strategy
- Show backup health badge on company page
- "Last backup: X hours ago" in company overview
- Critical backup failures create high-priority alert in portal

---

## Acronis

### Overview
Acronis provides cloud backup. More enterprise-focused than Datto, common in larger MSP stacks.

### Authentication
- **Method:** OAuth 2.0 (Client Credentials)
- **Base URL:** `https://{datacenter}.acronis.com/api/2/`

### Key Endpoints
```
GET    /tenants                      List client tenants
GET    /tenants/{id}/usages          Backup usage per tenant
GET    /tasks                        List backup tasks
GET    /alerts                       Active alerts
GET    /reports                      Generate reports
```

### Integration Strategy
- Similar to Datto — backup health badge per company
- Storage usage trending (useful for billing conversations)

---

## Fortinet FortiGate

### Overview
Fortinet provides firewall and network security. REST API available on FortiGate devices.

### Authentication
- **Method:** API Token (per-device)
- **Header:** `Authorization: Bearer {token}`
- **Base URL:** `https://{fortigate-ip}/api/v2/`
- **Note:** Each client has their own FortiGate device with its own token

### Key Endpoints
```
GET    /monitor/system/status        Firewall status, uptime, version
GET    /monitor/system/resource      CPU, memory usage
GET    /monitor/firewall/session     Active sessions
GET    /monitor/ipsec/tunnel/summary VPN tunnel status
GET    /monitor/system/ha-statistics HA cluster status
GET    /cmdb/system/interface        Interface list
```

### Integration Strategy
- VPN tunnel health on company page
- Firewall CPU/memory alerts
- Surface high session counts or policy anomalies

---

## Webex (Cisco)

### Overview
Webex is used for both team collaboration and phone system management (Webex Calling). REST API is comprehensive.

### Authentication
- **Method:** OAuth 2.0 (Authorization Code or Client Credentials)
- **Base URL:** `https://webexapis.com/v1/`
- **Scopes needed:** `spark:all`, `spark-calling:all`, `spark-admin:people_write`

### Key Endpoints

#### People / Users
```
GET    /people                       List users
GET    /people/{id}                  User detail
PATCH  /people/{id}                  Update user
POST   /people                       Create user
```

#### Calling (Phone System)
```
GET    /telephony/config/locations   Calling locations
GET    /telephony/config/queues      Call queues
GET    /telephony/config/autoAttendants  Auto-attendants
GET    /telephony/config/huntGroups  Hunt groups
GET    /people/{id}/features/callForwarding  Forwarding rules
PUT    /people/{id}/features/callForwarding  Update forwarding
```

#### Devices
```
GET    /devices                      Registered devices
GET    /devices/{id}                 Device detail
```

### Integration Strategy
- **Primary use case:** Manage client Webex Calling setups
- View/update call forwarding for client employees
- Call queue management
- DID/extension assignment
- This is a Phase 3 feature — scope carefully before implementing

---

## Passportal

### Overview
ConnectWise Passportal is a password vault and IT documentation platform. **There is no documented public REST API.**

### Current Status (2026)
- Acquired by ConnectWise in 2019; integrated into CW ecosystem
- No public API endpoints documented
- ConnectWise has not released a REST API for Passportal
- Custom/enterprise API access may be negotiable with ConnectWise account team

### Integration Approach: iframe Embed

Passportal supports embedding its interface in third-party portals via iframe. This is the only supported integration path.

```typescript
// components/passportal/PassportalEmbed.tsx
export function PassportalEmbed({ companyId }: { companyId: string }) {
  return (
    <iframe
      src={`https://bpassportal.com/embed/company/${companyId}`}
      className="w-full h-screen border-0"
      title="Passportal"
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  );
}
```

### Alternative: External Link
For simplest integration — link to Passportal with company context pre-filled. Less seamless but zero maintenance.

### Future API Watch
Check quarterly: `https://developer.connectwise.com` for any Passportal API announcements.

---

## Scalepad (Warranty Master)

### Overview
Scalepad tracks hardware asset lifecycles and warranty data. **There is no documented public REST API.**

### Current Status (2026)
- Acquired by ConnectWise
- No public REST API
- Data available via: CSV/Excel export (manual or scheduled), webhooks for lifecycle events
- Enterprise API access available via ConnectWise sales team (not self-serve)

### Integration Approach: Export Sync

Option 1 — **Scheduled export sync:**
- Configure Scalepad to export asset data on a schedule (nightly CSV)
- BFF imports CSV into local database table
- Portal reads from local table (fast, no Scalepad API dependency)

Option 2 — **Webhook receiver:**
- Configure Scalepad webhook to POST to `POST /api/webhooks/scalepad` on lifecycle events
- Store updated asset records in local DB

```typescript
// app/api/webhooks/scalepad/route.ts
export async function POST(request: Request) {
  const event = await request.json();

  if (event.type === 'asset.warranty_expiring') {
    await db.assetAlert.create({
      data: {
        tenantId: resolveTenantFromScalepadKey(request),
        assetId: event.assetId,
        type: 'warranty_expiring',
        expiresAt: new Date(event.warrantyExpiry),
      }
    });
  }
}
```

Option 3 — **Build internal asset module:**
- Enter asset/warranty data directly in portal
- Sync with ConnectWise Configurations endpoint
- Skip Scalepad dependency entirely for basic lifecycle tracking

**Recommendation:** Start with Option 3 (internal asset module using CW Configurations), add export sync in Phase 4 when needed.

---

## Integration Architecture Pattern

All integrations follow the same BFF pattern:

```typescript
// lib/integrations/base.ts
export abstract class IntegrationClient {
  abstract name: string;
  abstract authenticate(credentials: unknown): Promise<void>;
  abstract healthCheck(): Promise<boolean>;

  protected async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...this.authHeaders(),
        'Content-Type': 'application/json',
        ...options?.headers,
      }
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError(parseInt(retryAfter ?? '60'));
    }

    if (!response.ok) {
      throw new IntegrationError(this.name, response.status, await response.text());
    }

    return response.json();
  }

  protected abstract authHeaders(): Record<string, string>;
}
```

---

## Adding a New Integration

When adding a new platform integration:

1. Create `lib/integrations/{platform}/client.ts` — extends `IntegrationClient`
2. Create `lib/integrations/{platform}/types.ts` — TypeScript types for API responses
3. Create `lib/integrations/{platform}/normalizer.ts` — map platform data to portal data model
4. Add API routes in `app/api/integrations/{platform}/`
5. Add credentials schema to `prisma/schema.prisma` (in `tenants` table)
6. Add environment variable template to `.env.example`
7. Document in this file
8. Add to `docs/ROADMAP.md` under appropriate phase

---

## SmileBack (Customer Satisfaction — CSAT/NPS)

### Overview
SmileBack is the native ConnectWise customer feedback platform. It captures CSAT ratings (Positive/Neutral/Negative) triggered at ticket closure and NPS scores (0–10) via scheduled campaigns. Survey data links directly to CW tickets, technicians, companies, and contacts.

### Authentication
- **Method:** API Key
- **Base URL:** `https://app.smileback.io`
- **API Docs:** `https://app.smileback.io/api/docs/` (Swagger, requires SmileBack login)
- **Header:** API Key obtained from SmileBack Admin → API Credentials page
- **Credentials:** Stored in `.env.local` as `SMILEBACK_API_KEY`; also configurable via Admin → Integrations (Credential Vault)

### Rate Limits
- 100 API calls per connection per 60 seconds
- BFF cache reduces actual API calls (5 min for reviews, 10 min for summaries)
- Not a bottleneck for RX Skin's usage pattern

### Data Model

#### CSAT Review
| Field | Type | Description |
|-------|------|-------------|
| Rating | string | `Positive`, `Neutral`, or `Negative` |
| Comment | string (optional) | Customer's text comment |
| Company | string | CW company name |
| Contact | string | Customer's full name |
| Contact Email | string | Customer's email |
| Ticket ID | string | ConnectWise ticket ID (critical for ticket linkage) |
| Ticket Title | string | CW ticket summary |
| Ticket Agents | string | Comma-separated tech names (critical for per-tech scoring) |
| Ticket Segment | string | CW board/department name |
| Permalink | string | URL to view review in SmileBack |
| Has Marketing Permission | boolean | Customer consent for testimonials |
| Created At | datetime | When the survey was submitted |

#### NPS Response
| Field | Type | Description |
|-------|------|-------------|
| Score | integer | 0–10 (Promoter: 9–10, Passive: 7–8, Detractor: 0–6) |
| Comment | string (optional) | Customer's text comment |
| Company | string | CW company name |
| Contact | string | Customer's full name |
| Campaign | string | NPS campaign name |
| Created At | datetime | When the response was submitted |

### Key API Operations

#### Read-Only Data Retrieval
```
GET    /api/v3/csat/reviews          List CSAT reviews (filterable by date, company, rating, agent, board)
GET    /api/v3/csat/companies        List companies with CSAT data
GET    /api/v3/csat/contacts         List contacts with CSAT data
GET    /api/v3/nps/responses         List NPS responses (filterable by date, campaign, score)
GET    /api/v3/nps/campaigns         List NPS campaigns
GET    /api/v3/prj/surveys           List project survey results
```

Note: Exact endpoint paths should be confirmed via the Swagger docs at `app.smileback.io/api/docs/`. The above are inferred from the Data Replication API v3.3.

#### Webhook Triggers (Real-Time Push)
SmileBack supports webhook triggers for real-time notifications:

| Trigger | Fires When | Key Data |
|---------|-----------|----------|
| `CSAT_received` | Customer submits ticket satisfaction rating | Rating, Comment, Ticket ID, Agents, Company |
| `NPS_received` | Customer submits NPS survey response | Score, Comment, Company, Campaign |
| `PRJ_received` | Customer submits project survey result | Scores, Project Name, Phase Status |

Webhook filters available: Rating, Agents, Boards, Companies, Contacts, Comments-only, Marketing permissions.

### CSAT Scoring Methodology
```
CSAT % = (Positive count / Total responses) × 100

Positive = 😊 (mapped to score 100)
Neutral  = 😐 (mapped to score 50)
Negative = 😞 (mapped to score 0)
```

### NPS Scoring Methodology
```
NPS = % Promoters (9–10) − % Detractors (0–6)

Range: −100 to +100
Excellent: 50+
Good: 20–49
Needs Improvement: 0–19
At Risk: Below 0
```

### Integration Strategy
SmileBack data surfaces across multiple RX Skin views:

1. **Ticket Detail** — Survey response card (rating + comment) on tickets with feedback
2. **Ticket List** — Small survey badge (Smile/Meh/Frown icon) on tickets with responses
3. **Executive Dashboard** — CSAT % and NPS KPI cards + breakdown charts + recent feedback
4. **Team Page** — Per-tech CSAT scores and review counts
5. **My Day Dashboard** — Logged-in tech's personal CSAT score and monthly trend
6. **CBR Dashboard** — Per-client CSAT + NPS for Account Managers, integrated into health score
7. **Admin Integrations** — SmileBack credential management (API key + webhook secret)

### BFF Routes
```
GET    /api/smileback                    CSAT overview + summary (date range, company, rating filters)
GET    /api/smileback/nps                NPS overview + summary (date range, campaign filters)
GET    /api/smileback/ticket/{ticketId}  Survey response for a specific CW ticket
GET    /api/smileback/tech               Per-technician CSAT scores
GET    /api/smileback/company            Per-company CSAT + NPS scores
POST   /api/smileback/tickets/batch      Batch survey lookup for ticket list badges
POST   /api/webhooks/smileback           Webhook receiver for real-time survey events
```

### Environment Variables
```
SMILEBACK_API_KEY=                # API Key from SmileBack Admin → API Credentials
SMILEBACK_WEBHOOK_SECRET=         # Secret for validating incoming webhooks
```

### Known Quirks
- SmileBack API is read-only — cannot create or modify surveys via API
- Only North America instance (`app.smileback.io`) confirmed; other regional instances may differ
- `Ticket Agents` field is comma-separated — must be parsed and split for per-tech aggregation
- Company name matching between SmileBack and CW is by display name (not ID) — fuzzy matching may be needed
- Rate limit (100/60s) is per connection, not per endpoint

---

*Last updated: 2026-03-29*
