'use client'

import { useState, useEffect, useCallback } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Check,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  AlertTriangle,
  Plus,
  Pencil,
  Plug,
  Ban,
} from 'lucide-react'

// ── Platform definitions ─────────────────────────────────────

interface PlatformDef {
  id: string
  name: string
  tier: 1 | 2
  fields: { key: string; label: string; type: 'text' | 'password' | 'url' }[]
  description: string
  docsUrl?: string
}

const platforms: PlatformDef[] = [
  {
    id: 'connectwise',
    name: 'ConnectWise Manage',
    tier: 1,
    description: 'PSA — tickets, companies, projects, time entries',
    fields: [
      { key: 'baseUrl', label: 'API Base URL', type: 'url' },
      { key: 'companyId', label: 'Company ID', type: 'text' },
      { key: 'clientId', label: 'Client ID', type: 'text' },
      { key: 'publicKey', label: 'Public Key', type: 'password' },
      { key: 'privateKey', label: 'Private Key', type: 'password' },
    ],
  },
  {
    id: 'automate',
    name: 'ConnectWise Automate',
    tier: 1,
    description: 'RMM — computers, scripts, monitors, remote agents',
    fields: [
      { key: 'baseUrl', label: 'Base URL', type: 'url' },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
    ],
  },
  {
    id: 'control',
    name: 'ConnectWise Control',
    tier: 1,
    description: 'Remote access — session GUID lookup, remote control launch',
    fields: [
      { key: 'baseUrl', label: 'Server URL', type: 'url' },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
    ],
  },
  {
    id: 'sentinelone',
    name: 'SentinelOne',
    tier: 1,
    description: 'Endpoint security — agents, threats, scans',
    fields: [
      { key: 'baseUrl', label: 'Console URL', type: 'url' },
      { key: 'apiToken', label: 'API Token', type: 'password' },
    ],
  },
  {
    id: 'passportal',
    name: 'Passportal',
    tier: 1,
    description: 'Password management — credentials, documents',
    fields: [
      { key: 'baseUrl', label: 'API Base URL', type: 'url' },
      { key: 'apiKey', label: 'API Key', type: 'password' },
    ],
  },
  {
    id: 'scalepad',
    name: 'ScalePad',
    tier: 1,
    description: 'Lifecycle management — hardware assets, contracts',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password' },
    ],
  },
  {
    id: 'datto',
    name: 'Datto BCDR + SaaS',
    tier: 1,
    description: 'Backup & disaster recovery — devices, agents, alerts, SaaS protection',
    docsUrl: 'https://portal.dattobackup.com',
    fields: [
      { key: 'baseUrl', label: 'API Base URL', type: 'url' },
      { key: 'publicKey', label: 'Public Key', type: 'password' },
      { key: 'privateKey', label: 'Private Key', type: 'password' },
    ],
  },
  {
    id: 'auvik',
    name: 'Auvik',
    tier: 1,
    description: 'Network monitoring — devices, interfaces, alerts',
    fields: [
      { key: 'baseUrl', label: 'API Base URL', type: 'url' },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'apiKey', label: 'API Key', type: 'password' },
    ],
  },
  {
    id: 'microsoft',
    name: 'Microsoft 365 (Azure AD)',
    tier: 2,
    description: 'OAuth2 app — Graph API for mail, calendar, Teams, presence',
    fields: [
      { key: 'clientId', label: 'Application (Client) ID', type: 'text' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password' },
      { key: 'tenantId', label: 'Directory (Tenant) ID', type: 'text' },
    ],
  },
  {
    id: 'meraki',
    name: 'Cisco Meraki',
    tier: 1,
    description: 'Network monitoring — devices, uplinks, wireless, alerts, licensing (MSP multi-org)',
    fields: [
      { key: 'apiKey', label: 'API Key (Bearer Token)', type: 'password' },
      { key: 'webhookSecret', label: 'Webhook Secret (optional)', type: 'password' },
    ],
  },
  {
    id: 'smileback',
    name: 'SmileBack',
    tier: 1,
    description: 'Customer satisfaction (CSAT) and NPS survey integration',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password' },
      { key: 'webhookSecret', label: 'Webhook Secret (optional)', type: 'password' },
    ],
  },
  {
    id: 'webex',
    name: 'Webex',
    tier: 2,
    description: 'OAuth2 app — messaging, calling, presence, meetings',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password' },
      { key: 'redirectUri', label: 'Redirect URI', type: 'url' },
    ],
  },
]

// ── Component ────────────────────────────────────────────────

type ConnectionStatus = 'unconfigured' | 'configured' | 'testing' | 'connected' | 'error'

export default function IntegrationsPage() {
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Integrations</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage API credentials for all connected platforms. Credentials are encrypted with AES-256-GCM.
        </p>
      </div>

      {/* Tier 1: Service Accounts */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <Shield size={12} />
          Tier 1 — Service Account Credentials (per-tenant)
        </h3>
        {platforms.filter(p => p.tier === 1).map(platform => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            expanded={expandedPlatform === platform.id}
            onToggle={() => setExpandedPlatform(expandedPlatform === platform.id ? null : platform.id)}
          />
        ))}
      </div>

      {/* Tier 2: OAuth2 Apps */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <Shield size={12} />
          Tier 2 — OAuth2 App Credentials (user-delegated)
        </h3>
        {platforms.filter(p => p.tier === 2).map(platform => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            expanded={expandedPlatform === platform.id}
            onToggle={() => setExpandedPlatform(expandedPlatform === platform.id ? null : platform.id)}
          />
        ))}
      </div>

      {/* Microsoft 365 Client Tenants (GDAP) */}
      <ClientTenantsSection />
    </div>
  )
}

// ── Platform Card ────────────────────────────────────────────

function PlatformCard({
  platform,
  expanded,
  onToggle,
}: {
  platform: PlatformDef
  expanded: boolean
  onToggle: () => void
}) {
  // In production, status comes from credential vault DB lookup
  const [status] = useState<ConnectionStatus>('unconfigured')
  const [showSecrets, setShowSecrets] = useState(false)
  const [testing, setTesting] = useState(false)

  const statusConfig: Record<ConnectionStatus, { label: string; color: string; icon: LucideIcon }> = {
    unconfigured: { label: 'Not configured', color: 'text-gray-500', icon: X },
    configured: { label: 'Configured', color: 'text-yellow-400', icon: AlertTriangle },
    testing: { label: 'Testing...', color: 'text-blue-400', icon: RefreshCw },
    connected: { label: 'Connected', color: 'text-green-400', icon: Check },
    error: { label: 'Error', color: 'text-red-400', icon: X },
  }

  const st = statusConfig[status]
  const StatusIcon = st.icon

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header (always visible) */}
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-gray-100 dark:hover:bg-gray-800/30 transition-colors"
      >
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{platform.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{platform.description}</p>
        </div>
        <span className={`flex items-center gap-1.5 text-xs ${st.color}`}>
          <StatusIcon size={12} className={testing ? 'animate-spin' : ''} />
          {st.label}
        </span>
      </button>

      {/* Expanded: credential form */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-800 px-5 py-4 space-y-4">
          {platform.fields.map(field => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{field.label}</label>
              <div className="relative">
                <input
                  type={field.type === 'password' && !showSecrets ? 'password' : 'text'}
                  placeholder={field.type === 'url' ? 'https://...' : `Enter ${field.label.toLowerCase()}`}
                  className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 font-mono"
                />
                {field.type === 'password' && (
                  <button
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-300"
                  >
                    {showSecrets ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3 pt-2">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
              Save Credentials
            </button>
            <button
              onClick={() => setTesting(true)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 transition-colors"
            >
              Test Connection
            </button>
          </div>

          {/* Demo mode toggle for Meraki */}
          {platform.id === 'meraki' && (
            <MerakiDemoToggle />
          )}

          {/* Demo mode + enable toggle for Datto */}
          {platform.id === 'datto' && (
            <DattoDemoToggle />
          )}
        </div>
      )}
    </div>
  )
}

// ── Datto Integration Toggles ───────────────────────────────

function DattoDemoToggle() {
  const [isDemoMode, setIsDemoMode] = useState(true)
  const [isEnabled, setIsEnabled] = useState(true)
  const [isToggling, setIsToggling] = useState(false)
  // Load initial state
  useEffect(() => {
    fetch('/api/datto?endpoint=config')
      .then(r => r.json())
      .then(data => {
        setIsDemoMode(data.dataMode === 'demo')
        setIsEnabled(data.enabled !== false)
      })
      .catch(() => {})
  }, [])

  const handleToggleMode = async () => {
    setIsToggling(true)
    const newMode = isDemoMode ? 'live' : 'demo'
    try {
      const res = await fetch('/api/datto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'config', dataMode: newMode }),
      })
      if (res.ok) setIsDemoMode(!isDemoMode)
    } catch {} finally {
      setIsToggling(false)
    }
  }

  const handleToggleEnabled = async () => {
    setIsToggling(true)
    try {
      const res = await fetch('/api/datto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'config', enabled: !isEnabled }),
      })
      if (res.ok) setIsEnabled(!isEnabled)
    } catch {} finally {
      setIsToggling(false)
    }
  }

  return (
    <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-800 space-y-3">
      {/* Enable/Disable */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Integration Enabled</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Show Datto in the sidebar and fetch data</p>
        </div>
        <button
          onClick={handleToggleEnabled}
          disabled={isToggling}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            isEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
          } ${isToggling ? 'opacity-50' : ''}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            isEnabled ? 'translate-x-5' : 'translate-x-0'
          }`} />
        </button>
      </div>

      {/* Demo / Live toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Data Mode</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Switch between demo data and live Datto API</p>
        </div>
        <button
          onClick={handleToggleMode}
          disabled={isToggling}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            isDemoMode ? 'bg-amber-500' : 'bg-blue-500'
          } ${isToggling ? 'opacity-50' : ''}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            isDemoMode ? 'translate-x-0' : 'translate-x-5'
          }`} />
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`text-[10px] font-medium ${isDemoMode ? 'text-amber-500' : 'text-blue-500'}`}>
          {isDemoMode ? '⚡ Demo mode — showing mock devices & alerts' : '🔴 Live mode — connected to Datto API'}
        </span>
      </div>

    </div>
  )
}

// ── Meraki Demo Mode Toggle ─────────────────────────────────

function MerakiDemoToggle() {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  // Read initial state from cookie
  useEffect(() => {
    const match = document.cookie.match(/meraki_demo_mode=([^;]+)/)
    if (match) setIsDemoMode(match[1] === 'true')
  }, [])

  const handleToggle = async () => {
    setIsToggling(true)
    try {
      const res = await fetch('/api/meraki/demo-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !isDemoMode }),
      })
      if (res.ok) {
        setIsDemoMode(!isDemoMode)
        // Also set localStorage for client-side reads
        localStorage.setItem('meraki_demo_mode', (!isDemoMode).toString())
      }
    } catch {
      // ignore
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Demo Data Mode</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Use realistic mock data instead of live API calls</p>
        </div>
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            isDemoMode ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-700'
          } ${isToggling ? 'opacity-50' : ''}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            isDemoMode ? 'translate-x-5' : 'translate-x-0'
          }`} />
        </button>
      </div>
      {isDemoMode && (
        <div className="mt-2 flex items-center gap-1.5">
          <AlertTriangle size={12} className="text-amber-500" />
          <span className="text-[10px] text-amber-500 font-medium">Demo mode active — dashboard shows mock data</span>
        </div>
      )}
    </div>
  )
}

// ── Client Tenants Section ──────────────────────────────────

interface ClientTenantRecord {
  id: string
  azureTenantId: string
  displayName: string
  domain: string | null
  cwCompanyId: number | null
  gdapRelationshipId: string | null
  gdapStatus: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const gdapStatusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-600 dark:text-green-400',
  pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  expired: 'bg-red-500/10 text-red-600 dark:text-red-400',
}

function ClientTenantsSection() {
  const [tenants, setTenants] = useState<ClientTenantRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null)

  // Form state
  const [formDisplayName, setFormDisplayName] = useState('')
  const [formAzureTenantId, setFormAzureTenantId] = useState('')
  const [formDomain, setFormDomain] = useState('')
  const [formCwCompanyId, setFormCwCompanyId] = useState('')
  const [formGdapRelationshipId, setFormGdapRelationshipId] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchTenants = useCallback(async () => {
    try {
      const res = await fetch('/api/m365/tenants')
      if (res.ok) {
        const data = (await res.json()) as ClientTenantRecord[]
        setTenants(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTenants()
  }, [fetchTenants])

  const resetForm = () => {
    setFormDisplayName('')
    setFormAzureTenantId('')
    setFormDomain('')
    setFormCwCompanyId('')
    setFormGdapRelationshipId('')
    setFormError(null)
    setEditingId(null)
  }

  const handleEdit = (tenant: ClientTenantRecord) => {
    setFormDisplayName(tenant.displayName)
    setFormAzureTenantId(tenant.azureTenantId)
    setFormDomain(tenant.domain ?? '')
    setFormCwCompanyId(tenant.cwCompanyId?.toString() ?? '')
    setFormGdapRelationshipId(tenant.gdapRelationshipId ?? '')
    setFormError(null)
    setEditingId(tenant.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formDisplayName.trim() || !formAzureTenantId.trim()) {
      setFormError('Display Name and Azure AD Tenant ID are required.')
      return
    }

    setSaving(true)
    setFormError(null)

    const payload = {
      displayName: formDisplayName.trim(),
      azureTenantId: formAzureTenantId.trim(),
      domain: formDomain.trim() || undefined,
      cwCompanyId: formCwCompanyId ? parseInt(formCwCompanyId, 10) : undefined,
      gdapRelationshipId: formGdapRelationshipId.trim() || undefined,
    }

    try {
      let res: Response
      if (editingId) {
        res = await fetch('/api/m365/tenants', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        })
      } else {
        res = await fetch('/api/m365/tenants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (res.ok) {
        await fetchTenants()
        resetForm()
        setShowForm(false)
      } else {
        const err = (await res.json()) as { message?: string }
        setFormError(err.message ?? 'Failed to save client tenant.')
      }
    } catch {
      setFormError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDisable = async (id: string) => {
    try {
      const res = await fetch('/api/m365/tenants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        await fetchTenants()
      }
    } catch {
      // ignore
    }
  }

  const handleTestConnection = async (tenant: ClientTenantRecord) => {
    setTestingId(tenant.id)
    setTestResult(null)

    try {
      const res = await fetch('/api/m365/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientTenantId: tenant.azureTenantId }),
      })
      const data = (await res.json()) as { success: boolean; organizationName?: string; error?: string }
      setTestResult({
        id: tenant.id,
        success: data.success,
        message: data.success
          ? `Connected: ${data.organizationName}`
          : `Failed: ${data.error}`,
      })
    } catch {
      setTestResult({
        id: tenant.id,
        success: false,
        message: 'Network error — could not reach API.',
      })
    } finally {
      setTestingId(null)
    }
  }

  const activeTenants = tenants.filter((t) => t.isActive)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <Plug size={12} />
          Microsoft 365 Client Tenants (GDAP)
        </h3>
        <button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          <Plus size={12} />
          Add Client Tenant
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-5 space-y-4">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {editingId ? 'Edit Client Tenant' : 'Add Client Tenant'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formDisplayName}
                onChange={(e) => setFormDisplayName(e.target.value)}
                placeholder="Acme Corp"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Azure AD Tenant ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formAzureTenantId}
                onChange={(e) => setFormAzureTenantId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                disabled={!!editingId}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 font-mono disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Primary Domain
              </label>
              <input
                type="text"
                value={formDomain}
                onChange={(e) => setFormDomain(e.target.value)}
                placeholder="acmecorp.com"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                CW Company ID
              </label>
              <input
                type="number"
                value={formCwCompanyId}
                onChange={(e) => setFormCwCompanyId(e.target.value)}
                placeholder="12345"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                GDAP Relationship ID
              </label>
              <input
                type="text"
                value={formGdapRelationshipId}
                onChange={(e) => setFormGdapRelationshipId(e.target.value)}
                placeholder="Optional — GDAP relationship identifier"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 font-mono"
              />
            </div>
          </div>

          {formError && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <AlertTriangle size={12} />
              {formError}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update Tenant' : 'Add Tenant'}
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                resetForm()
              }}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700/50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tenant table */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-8 text-center">
          <RefreshCw size={16} className="animate-spin mx-auto text-gray-400" />
          <p className="text-xs text-gray-500 mt-2">Loading client tenants...</p>
        </div>
      ) : activeTenants.length === 0 && !showForm ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-8 text-center">
          <p className="text-sm text-gray-500">No client tenants configured.</p>
          <p className="text-xs text-gray-400 mt-1">
            Add a client tenant to manage their Microsoft 365 environment via GDAP.
          </p>
        </div>
      ) : activeTenants.length > 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Display Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Domain
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GDAP Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {activeTenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{tenant.displayName}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5 truncate max-w-[200px]">
                        {tenant.azureTenantId}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-gray-600 dark:text-gray-400">
                        {tenant.domain ?? '--'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          gdapStatusColors[tenant.gdapStatus] ?? 'bg-gray-500/10 text-gray-500'
                        }`}
                      >
                        {tenant.gdapStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTestConnection(tenant)}
                          disabled={testingId === tenant.id}
                          title="Test connection"
                          className="p-1.5 rounded-md text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw
                            size={14}
                            className={testingId === tenant.id ? 'animate-spin' : ''}
                          />
                        </button>
                        <button
                          onClick={() => handleEdit(tenant)}
                          title="Edit"
                          className="p-1.5 rounded-md text-gray-500 hover:text-yellow-500 hover:bg-yellow-500/10 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDisable(tenant.id)}
                          title="Disable"
                          className="p-1.5 rounded-md text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Ban size={14} />
                        </button>
                      </div>
                      {/* Test result feedback */}
                      {testResult?.id === tenant.id && (
                        <p
                          className={`text-[10px] mt-1 text-right ${
                            testResult.success ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {testResult.message}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
