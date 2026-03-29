// ============================================================
// Microsoft 365 TypeScript Types — RX Skin
// ============================================================

// ── Users ───────────────────────────────────────────────────

export interface M365User {
  id: string
  displayName: string
  userPrincipalName: string
  mail: string | null
  jobTitle: string | null
  department: string | null
  accountEnabled: boolean
  createdDateTime: string
  assignedLicenses: { skuId: string }[]
  mfaRegistered?: boolean
}

// ── Groups ──────────────────────────────────────────────────

export interface M365Group {
  id: string
  displayName: string
  description: string | null
  groupTypes: string[]
  securityEnabled: boolean
  mailEnabled: boolean
  memberCount?: number
}

// ── Mail ────────────────────────────────────────────────────

export interface M365Message {
  id: string
  subject: string
  bodyPreview: string
  body?: { contentType: string; content: string }
  from: { emailAddress: { name: string; address: string } }
  toRecipients: { emailAddress: { name: string; address: string } }[]
  ccRecipients: { emailAddress: { name: string; address: string } }[]
  receivedDateTime: string
  isRead: boolean
  hasAttachments: boolean
  importance: 'low' | 'normal' | 'high'
}

// ── Calendar ────────────────────────────────────────────────

export interface M365Event {
  id: string
  subject: string
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
  location?: { displayName: string }
  organizer: { emailAddress: { name: string; address: string } }
  attendees: { emailAddress: { name: string; address: string }; status: { response: string } }[]
  isOnlineMeeting: boolean
  onlineMeeting?: { joinUrl: string }
  bodyPreview: string
  body?: { contentType: string; content: string }
}

// ── Teams ───────────────────────────────────────────────────

export interface M365Chat {
  id: string
  topic: string | null
  chatType: 'oneOnOne' | 'group' | 'meeting'
  lastMessagePreview?: { body: { content: string }; from: { user: { displayName: string } }; createdDateTime: string }
  members?: { displayName: string; userId: string }[]
}

export interface M365ChatMessage {
  id: string
  body: { contentType: string; content: string }
  from: { user: { displayName: string; id: string } } | null
  createdDateTime: string
  messageType: string
}

export interface M365Presence {
  id: string
  availability: 'Available' | 'Busy' | 'DoNotDisturb' | 'BeRightBack' | 'Away' | 'Offline' | 'PresenceUnknown'
  activity: string
}

// ── Licenses ────────────────────────────────────────────────

export interface M365License {
  skuId: string
  skuPartNumber: string
  capabilityStatus: string
  consumedUnits: number
  prepaidUnits: { enabled: number; suspended: number; warning: number }
  servicePlans: { servicePlanId: string; servicePlanName: string; provisioningStatus: string }[]
}

export interface M365UserLicense {
  userId: string
  displayName: string
  userPrincipalName: string
  assignedLicenses: { skuId: string; disabledPlans: string[] }[]
}

// ── Security ────────────────────────────────────────────────

export interface M365RiskyUser {
  id: string
  userDisplayName: string
  userPrincipalName: string
  riskLevel: 'low' | 'medium' | 'high' | 'hidden' | 'none'
  riskState: string
  riskDetail: string
  riskLastUpdatedDateTime: string
}

export interface M365SignIn {
  id: string
  userDisplayName: string
  userPrincipalName: string
  appDisplayName: string
  ipAddress: string
  location: { city: string; state: string; countryOrRegion: string }
  status: { errorCode: number; failureReason: string }
  createdDateTime: string
  isInteractive: boolean
  mfaDetail?: { authMethod: string; authDetail: string }
}

export interface M365ConditionalAccessPolicy {
  id: string
  displayName: string
  state: 'enabled' | 'disabled' | 'enabledForReportingButNotEnforced'
  conditions: Record<string, unknown>
  grantControls: Record<string, unknown> | null
}

// ── Client Tenant ───────────────────────────────────────────

export interface ClientTenant {
  id: string
  azureTenantId: string
  displayName: string
  domain: string | null
  cwCompanyId: number | null
  gdapStatus: 'active' | 'pending' | 'expired'
  gdapExpiresAt: string | null
  isActive: boolean
}

// ── Audit ───────────────────────────────────────────────────

export interface M365AuditAction {
  id: string
  clientTenantId: string
  actorEmail: string
  action: string
  targetId: string
  targetName: string
  details: Record<string, unknown> | null
  createdAt: string
}
