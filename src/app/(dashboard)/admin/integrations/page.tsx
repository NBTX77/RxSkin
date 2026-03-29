'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Check,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  AlertTriangle,
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
    name: 'Datto BCDR',
    tier: 1,
    description: 'Backup — devices, agents, recovery points',
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
        </div>
      )}
    </div>
  )
}
