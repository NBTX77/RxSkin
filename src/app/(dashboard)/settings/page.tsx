'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import {
  User,
  Palette,
  Link2,
  Bell,
  Sun,
  Moon,
  Check,
  ExternalLink,
  Mail,
  Phone,
} from 'lucide-react'
import { useTheme } from '@/components/theme/ThemeProvider'
import { useDepartment } from '@/components/department/DepartmentProvider'

type SettingsTab = 'profile' | 'appearance' | 'connections' | 'notifications'

const tabs: { id: SettingsTab; label: string; icon: LucideIcon }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'connections', label: 'Connections', icon: Link2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  return (
    <div className="max-w-3xl space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-300 hover:border-gray-700'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'appearance' && <AppearanceTab />}
      {activeTab === 'connections' && <ConnectionsTab />}
      {activeTab === 'notifications' && <NotificationsTab />}
    </div>
  )
}

// ── Profile Tab ───────────────────────────────────────────────

function ProfileTab() {
  const { data: session } = useSession()
  const { config, department } = useDepartment()
  const user = session?.user

  return (
    <div className="space-y-6">
      {/* Avatar + Name */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-900 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-gray-900 dark:text-white text-xl font-semibold">
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
            </span>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <InfoRow label="Role" value={user?.role || '—'} />
          <InfoRow label="Department" value={`${config.name} (${department})`} />
          <InfoRow label="Tenant ID" value={user?.tenantId || '—'} mono />
          {user?.cwMemberId && <InfoRow label="CW Member ID" value={user.cwMemberId} mono />}
        </div>
      </div>

      {/* ConnectWise Connection */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-900 p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">ConnectWise Connection</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Status</span>
            <span className="flex items-center gap-1.5 text-green-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Appearance Tab ────────────────────────────────────────────

function AppearanceTab() {
  const { theme, toggleTheme } = useTheme()

  const themes = [
    { id: 'dark', label: 'Dark', icon: Moon, description: 'Dark background, easy on the eyes' },
    { id: 'light', label: 'Light', icon: Sun, description: 'Light background for bright environments' },
  ] as const

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-900 p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Theme</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {themes.map(({ id, label, icon: Icon, description }) => {
            const active = theme === id
            return (
              <button
                key={id}
                onClick={() => { if (theme !== id) toggleTheme() }}
                className={`flex items-start gap-3 p-4 rounded-lg border transition-colors text-left ${
                  active
                    ? 'border-blue-500/50 bg-blue-600/10'
                    : 'border-gray-700 bg-gray-100 dark:bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <Icon size={20} className={active ? 'text-blue-400' : 'text-gray-500'} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${active ? 'text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                </div>
                {active && <Check size={16} className="text-blue-400 mt-0.5" />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-900 p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Display</h2>
        <div className="space-y-4">
          <ToggleRow label="Compact mode" description="Reduce spacing in tables and lists" defaultValue={false} />
          <ToggleRow label="Show ticket IDs" description="Display CW ticket numbers in lists" defaultValue={true} />
        </div>
      </div>
    </div>
  )
}

// ── Connections Tab ───────────────────────────────────────────

interface ConnectionConfig {
  id: string
  label: string
  description: string
  icon: LucideIcon
  connected: boolean
  features: string[]
}

function ConnectionsTab() {
  // In production, these would come from the UserOAuthToken table
  const connections: ConnectionConfig[] = [
    {
      id: 'microsoft',
      label: 'Microsoft 365',
      description: 'Outlook mail, calendar, Teams presence',
      icon: Mail,
      connected: false,
      features: ['Inbox preview', 'Calendar sync', 'Teams presence', 'Send email'],
    },
    {
      id: 'webex',
      label: 'Webex',
      description: 'Messaging, calling, presence',
      icon: Phone,
      connected: false,
      features: ['Messages', 'Call history', 'Click-to-call', 'Presence'],
    },
  ]

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Connect your accounts to enable integrations in your dashboard.
        These connections are personal — only your data is accessed.
      </p>

      {connections.map(conn => (
        <div key={conn.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-900 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                conn.connected ? 'bg-green-600/20' : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <conn.icon size={20} className={conn.connected ? 'text-green-400' : 'text-gray-500'} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{conn.label}</p>
                <p className="text-xs text-gray-500">{conn.description}</p>
              </div>
            </div>

            {conn.connected ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <Check size={12} /> Connected
                </span>
                <button className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1 rounded">
                  Disconnect
                </button>
              </div>
            ) : (
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors">
                Connect
                <ExternalLink size={12} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {conn.features.map(feat => (
              <span key={feat} className="text-[10px] px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700/50">
                {feat}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Notifications Tab ─────────────────────────────────────────

function NotificationsTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-900 p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Email Notifications</h2>
        <div className="space-y-4">
          <ToggleRow label="Ticket assigned to me" description="When a new ticket is assigned to you" defaultValue={true} />
          <ToggleRow label="Ticket status changes" description="When tickets you're watching change status" defaultValue={true} />
          <ToggleRow label="Schedule changes" description="When your schedule entries are modified" defaultValue={false} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-900 p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">In-App Notifications</h2>
        <div className="space-y-4">
          <ToggleRow label="Desktop notifications" description="Browser push notifications for alerts" defaultValue={false} />
          <ToggleRow label="Sound alerts" description="Play a sound for new notifications" defaultValue={false} />
        </div>
      </div>
    </div>
  )
}

// ── Shared Components ─────────────────────────────────────────

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className={`text-gray-800 dark:text-gray-200 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}

function ToggleRow({ label, description, defaultValue }: { label: string; description: string; defaultValue: boolean }) {
  const [enabled, setEnabled] = useState(defaultValue)

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-gray-700 dark:text-gray-300">{label}</p>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
          enabled ? 'bg-blue-600' : 'bg-gray-700'
        }`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          enabled ? 'left-5' : 'left-0.5'
        }`} />
      </button>
    </div>
  )
}
