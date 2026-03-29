'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Search,
  Shield,
  Key,
  LogIn,
  Globe,
} from 'lucide-react'

// ── Mock audit entries ───────────────────────────────────────

interface AuditEntry {
  id: string
  timestamp: string
  userId: string
  userName: string
  action: 'api_call' | 'credential_access' | 'login' | 'admin_action'
  platform?: string
  endpoint?: string
  detail: string
  ipAddress?: string
}

const mockEntries: AuditEntry[] = [
  { id: '1', timestamp: '2026-03-28T14:32:15Z', userId: '1', userName: 'Travis Brown', action: 'login', detail: 'Logged in via credentials', ipAddress: '192.168.1.100' },
  { id: '2', timestamp: '2026-03-28T14:32:20Z', userId: '1', userName: 'Travis Brown', action: 'api_call', platform: 'connectwise', endpoint: 'GET /service/tickets', detail: 'Fetched 25 tickets' },
  { id: '3', timestamp: '2026-03-28T14:33:01Z', userId: '1', userName: 'Travis Brown', action: 'api_call', platform: 'automate', endpoint: 'GET /computers', detail: 'Fetched computers for "Acme Corp"' },
  { id: '4', timestamp: '2026-03-28T14:33:45Z', userId: '1', userName: 'Travis Brown', action: 'credential_access', platform: 'control', detail: 'Decrypted ScreenConnect credentials for tenant rx-technology' },
  { id: '5', timestamp: '2026-03-28T14:34:12Z', userId: '1', userName: 'Travis Brown', action: 'api_call', platform: 'control', endpoint: 'POST /GetHostSessionInfo', detail: 'Session GUID lookup for "BPSHV01"' },
  { id: '6', timestamp: '2026-03-28T14:35:00Z', userId: '2', userName: 'John Smith', action: 'login', detail: 'Logged in via credentials', ipAddress: '10.0.0.55' },
  { id: '7', timestamp: '2026-03-28T14:36:30Z', userId: '1', userName: 'Travis Brown', action: 'admin_action', detail: 'Updated tenant cache TTL: tickets 30s → 45s' },
  { id: '8', timestamp: '2026-03-28T14:37:00Z', userId: '2', userName: 'John Smith', action: 'api_call', platform: 'connectwise', endpoint: 'POST /time/entries', detail: 'Created time entry on ticket #48291' },
]

const actionConfig: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  api_call: { label: 'API Call', icon: Globe, color: 'text-blue-400 bg-blue-600/15' },
  credential_access: { label: 'Credential Access', icon: Key, color: 'text-orange-400 bg-orange-600/15' },
  login: { label: 'Login', icon: LogIn, color: 'text-green-400 bg-green-600/15' },
  admin_action: { label: 'Admin Action', icon: Shield, color: 'text-purple-400 bg-purple-600/15' },
}

export default function AuditLogPage() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  const filtered = mockEntries.filter(e => {
    const matchesSearch = e.detail.toLowerCase().includes(search.toLowerCase()) ||
      e.userName.toLowerCase().includes(search.toLowerCase()) ||
      (e.platform || '').toLowerCase().includes(search.toLowerCase())
    const matchesAction = actionFilter === 'all' || e.action === actionFilter
    return matchesSearch && matchesAction
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Log</h2>
        <p className="text-sm text-gray-500 mt-1">
          All API calls, credential access, logins, and admin actions. Filterable by user, date, and platform.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All actions</option>
          <option value="api_call">API Calls</option>
          <option value="credential_access">Credential Access</option>
          <option value="login">Logins</option>
          <option value="admin_action">Admin Actions</option>
        </select>
      </div>

      {/* Log entries */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        {filtered.map(entry => {
          const config = actionConfig[entry.action]
          const Icon = config.icon
          const time = new Date(entry.timestamp)

          return (
            <div key={entry.id} className="flex items-start gap-3 px-5 py-3 border-b border-gray-200 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
              {/* Action icon */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${config.color}`}>
                <Icon size={14} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-900 dark:text-white font-medium">{entry.userName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700/50">
                    {config.label}
                  </span>
                  {entry.platform && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700/50">
                      {entry.platform}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{entry.detail}</p>
                {entry.endpoint && (
                  <p className="text-[10px] text-gray-600 font-mono mt-0.5">{entry.endpoint}</p>
                )}
              </div>

              {/* Timestamp */}
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-gray-500">
                  {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
                </p>
                {entry.ipAddress && (
                  <p className="text-[10px] text-gray-600 font-mono">{entry.ipAddress}</p>
                )}
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-gray-500">No log entries match your filters.</div>
        )}
      </div>
    </div>
  )
}
