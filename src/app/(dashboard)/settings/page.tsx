'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from '@/components/theme/ThemeProvider'
import { User, Palette, Link2, Bell, Moon, Sun, LogOut, Monitor, Smartphone, ExternalLink } from 'lucide-react'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'connections', label: 'Connections', icon: Link2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
] as const

type TabId = typeof TABS[number]['id']

export default function SettingsPage() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [desktopPush, setDesktopPush] = useState(false)
  const [soundAlerts, setSoundAlerts] = useState(true)
  const [emailDigest, setEmailDigest] = useState('daily')
  const [compactMode, setCompactMode] = useState(false)

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-700'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
    </button>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-800 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="max-w-2xl">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-800 border border-gray-700">
              <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white">
                {session?.user?.name?.split(' ').map(n => n[0]).join('') || 'TB'}
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{session?.user?.name || 'Not set'}</p>
                <p className="text-sm text-gray-400">{session?.user?.email}</p>
                <p className="text-xs text-gray-500 mt-1">IT Department</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                <p className="text-white">{session?.user?.email}</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                <p className="text-white">Administrator</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                <label className="block text-sm font-medium text-gray-400 mb-1">Department</label>
                <p className="text-white">IT</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                <label className="block text-sm font-medium text-gray-400 mb-1">ConnectWise Status</label>
                <p className="text-green-400 font-medium">Connected</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800 space-y-3">
              <div className="text-sm text-gray-500">Session: <span className="text-green-400 font-medium">Active</span></div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/20 border border-red-800/50 text-red-400 hover:bg-red-900/30 transition-colors text-sm"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
              <h3 className="text-sm font-medium text-white mb-3">Theme</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <Sun size={16} />
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <Moon size={16} />
                  Dark
                </button>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white">Compact Mode</h3>
                <p className="text-xs text-gray-500 mt-1">Reduce spacing and use smaller text throughout the UI</p>
              </div>
              <Toggle enabled={compactMode} onChange={setCompactMode} />
            </div>

            <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
              <h3 className="text-sm font-medium text-white mb-3">Default Ticket View</h3>
              <select className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="table">Table View</option>
                <option value="cards">Card View</option>
                <option value="kanban">Kanban View</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Connect your accounts to enable integrations across RX Skin.</p>

            <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                  <Monitor size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Microsoft 365</p>
                  <p className="text-xs text-gray-500">Email, calendar, presence, Teams chat</p>
                </div>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
                <ExternalLink size={14} />
                Connect
              </button>
            </div>

            <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                  <Smartphone size={20} className="text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Webex</p>
                  <p className="text-xs text-gray-500">Calling, messaging, queue stats</p>
                </div>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
                <ExternalLink size={14} />
                Connect
              </button>
            </div>

            <p className="text-xs text-gray-600 mt-2">OAuth2 connections are per-user. Your tokens are stored encrypted and auto-refreshed.</p>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
              <h3 className="text-sm font-medium text-white mb-3">Email Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">New ticket assignments</span>
                  <Toggle enabled={notificationsEnabled} onChange={setNotificationsEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Ticket status updates</span>
                  <Toggle enabled={notificationsEnabled} onChange={setNotificationsEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Schedule reminders</span>
                  <Toggle enabled={notificationsEnabled} onChange={setNotificationsEnabled} />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
              <h3 className="text-sm font-medium text-white mb-3">Email Digest</h3>
              <select
                value={emailDigest}
                onChange={(e) => setEmailDigest(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="off">Off</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white">Desktop Push Notifications</h3>
                <p className="text-xs text-gray-500 mt-1">Get browser notifications for urgent tickets</p>
              </div>
              <Toggle enabled={desktopPush} onChange={setDesktopPush} />
            </div>

            <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white">Sound Alerts</h3>
                <p className="text-xs text-gray-500 mt-1">Play a sound for new notifications</p>
              </div>
              <Toggle enabled={soundAlerts} onChange={setSoundAlerts} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-600 max-w-2xl">
        RX Skin v0.1.0 — ConnectWise Modern Portal
      </div>
    </div>
  )
}
