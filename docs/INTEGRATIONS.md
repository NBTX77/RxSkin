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
| Cisco Meraki | 3 | ✅ REST | API Key (header) | Network/wifi/devices |
| Datto BCDR | 3 | ✅ REST | API Key | Backup status |
| Acronis | 3 | ✅ REST | OAuth 2.0 | Backup status |
| Fortinet FortiGate | 3 | ✅ REST | API Key | Firewall status |
| Webex (Cisco) | 3 | ✅ REST | OAuth 2.0 | Phone system + calling |
| Passportal | 4 | ❌ No public API | iframe embed | Password vault |
| Scalepad | 4 | ❌ No public API | Data export sync | Asset lifecycle |

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

## Cisco Meraki

### Overview
Meraki provides cloud-managed networking (switches, APs, security appliances). REST API is clean and well-documented.

### Authentication
- **Method:** API Key in header
- **Header:** `X-Cisco-Meraki-API-Key: {apiKey}`
- **Base URL:** `https://api.meraki.com/api/v1/`

### Key Endpoints
```
GET    /organizations                List organizations (clients)
GET    /organizations/{id}/networks  Networks in org
GET    /organizations/{id}/devices   All devices in org
GET    /networks/{id}/devices        Devices in network
GET    /networks/{id}/clients        Connected clients
GET    /networks/{id}/alerts/history Alert history
GET    /devices/{serial}/clients     Clients on device
GET    /organizations/{id}/uplinks/statuses  WAN uplink status
```

### Integration Strategy
- Map Meraki `organizationId` → ConnectWise `companyId`
- Show network health on company dashboard
- Surface WAN uplink alerts as priority indicators

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

*Last updated: 2026-03-26*
