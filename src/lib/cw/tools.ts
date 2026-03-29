export interface ExternalTool {
  id: string
  name: string
  url: string
  icon?: string
  category?: string
}

export const DEFAULT_TOOLS: ExternalTool[] = [
  { id: 'meraki', name: 'Meraki SSO', url: 'https://account.meraki.com/login/dashboard_login', category: 'Network' },
  { id: 'scalepad', name: 'ScalePad', url: 'https://app.scalepad.com', category: 'Assessment' },
  { id: 'auvik', name: 'Auvik', url: 'https://manage.auvik.com', category: 'Network' },
  { id: 'passportal', name: 'PassPortal', url: 'https://passportal.cloud', category: 'Security' },
  { id: 'acronis', name: 'Acronis', url: 'https://cloud.acronis.com', category: 'Backup' },
  { id: 'duo', name: 'DUO Admin', url: 'https://admin.duosecurity.com', category: 'Security' },
  { id: 'umbrella', name: 'Cisco Umbrella', url: 'https://dashboard.umbrella.com', category: 'Security' },
  { id: 'proofpoint', name: 'ProofPoint', url: 'https://admin.proofpoint.com', category: 'Security' },
  { id: 'datto', name: 'Datto', url: 'https://portal.dattobackup.com', category: 'Backup' },
  { id: 'sentinelone', name: 'Sentinel One', url: 'https://usea1-rx.sentinelone.net', category: 'Security' },
  { id: 'rx-s1', name: 'RX - S1', url: 'https://usea1-rx.sentinelone.net', category: 'Security' },
  { id: 'automate', name: 'Automate', url: 'https://automate.rxtech.com', category: 'RMM' },
  { id: 'siteowl', name: 'SiteOwl', url: 'https://app.siteowl.com', category: 'Physical Security' },
  { id: 'webex', name: 'WebEx', url: 'https://teams.webex.com', category: 'Communication' },
]

// FUTURE: Dynamic Tool Resolution
// Phase 2: Store tool URLs in TenantSettings DB table, editable via Admin Panel
// Phase 3: Embed tools in iframes or use vendor APIs for single-pane-of-glass
// Phase 4: CW Manage "My Documents" API can provide per-user tool links
