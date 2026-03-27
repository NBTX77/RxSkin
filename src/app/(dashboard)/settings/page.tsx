'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from '@/components/theme/ThemeProvider'
import { Settings, Bell, Lock, User, LogOut, Moon, Sun } from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const { theme } = useTheme()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailDigest, setEmailDigest] = useState('daily')

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <main className="flex-1 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Account Section */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User size={20} />
              Account
            </h2>

            <div className="space-y-4">
              {/* Email display */}
              <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <p className="text-white">{session?.user?.email}</p>
              </div>

              {/* Name display */}
              <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <p className="text-white">{session?.user?.name || 'Not set'}</p>
              </div>

              {/* Change password link */}
              <button className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 transition-colors text-left">
                <span className="text-sm font-medium">Change Password</span>
              </button>
            </div>
          </div>

          {/* Preferences Section */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings size={20} />
              Preferences
            </h2>

            <div className="space-y-4">
              {/* Theme toggle */}
              <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Moon size={16} className="text-gray-400" />
                  ) : (
                    <Sun size={16} className="text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-300">
                    Theme: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  Toggle in sidebar or mobile nav
                </span>
              </div>

              {/* Email digest frequency */}
              <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Email Digest Frequency
                </label>
                <select
                  value={emailDigest}
                  onChange={(e) => setEmailDigest(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="off">Off</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Bell size={20} />
              Notifications
            </h2>

            <div className="space-y-4">
              {/* Notifications toggle */}
              <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Browser Notifications</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Receive alerts for ticket updates and schedule changes
                  </p>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                    notificationsEnabled ? 'bg-blue-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      notificationsEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {notificationsEnabled && (
                <div className="p-4 rounded-lg bg-gray-900 border border-gray-700 text-sm text-gray-400">
                  <p>Notification preferences:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                    <li>New ticket assignments</li>
                    <li>Status updates on your tickets</li>
                    <li>Upcoming scheduled appointments</li>
                    <li>Team member mentions</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Security Section */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Lock size={20} />
              Security
            </h2>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                <p className="text-sm text-gray-300">
                  Session: <span className="text-green-400 font-medium">Active</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Your session will expire after 30 days of inactivity.
                </p>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full p-4 rounded-lg bg-red-900/20 border border-red-800/50 text-red-400 hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>

          {/* Footer info */}
          <div className="p-4 rounded-lg bg-gray-900 border border-gray-700 text-xs text-gray-500">
            <p>RX Skin v0.1.0 — ConnectWise Modern Portal</p>
            <p className="mt-1">Additional settings and administration features coming soon.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
