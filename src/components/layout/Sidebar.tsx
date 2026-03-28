'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Sun,
  Moon,
  Ticket,
  Calendar,
  Building2,
  Settings,
  LogOut,
  Search,
  Radar,
  ChevronDown,
  ChevronRight,
  Map,
  BarChart3,
  Clock,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useTheme } from '@/components/theme/ThemeProvider'

const navItems = [
  { href: '/dashboard', label: 'My Day', icon: Sun },
  { href: '/tickets', label: 'Tickets', icon: Ticket },
  { href: '/schedule', label: 'Schedule', icon: Calendar },
  { href: '/companies', label: 'Companies', icon: Building2 },
]

const opsSubItems = [
  { href: '/ops/fleet-map', label: 'Fleet Map', icon: Map },
  { href: '/ops/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/ops/holds', label: 'Schedule Holds', icon: Clock },
]
export function Sidebar() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [opsExpanded, setOpsExpanded] = useState(pathname.startsWith('/ops'))

  const isOpsActive = pathname.startsWith('/ops')

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-52 bg-gray-900 border-r border-gray-800 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm" style={{ color: '#fff' }}>RX</span>
        </div>
        <div>
          <p className="text-white font-semibold text-sm">RX Skin</p>
          <p className="text-gray-500 text-xs">ConnectWise Portal</p>
        </div>
      </div>

      {/* Search shortcut */}
      <div className="px-3 pt-4 pb-2">
        <button
          onClick={() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }))
          }}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-700/50 text-gray-500 text-sm hover:bg-gray-800 hover:text-gray-400 transition-colors"
        >
          <Search size={14} />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-600">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
        {/* Ops expandable section */}
        <div>
          <button
            onClick={() => setOpsExpanded(!opsExpanded)}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isOpsActive
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Radar size={18} />
            <span className="flex-1 text-left">Ops</span>
            {opsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {opsExpanded && (
            <div className="ml-4 mt-1 space-y-0.5">
              {opsSubItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? 'text-blue-400 bg-blue-600/10'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon size={15} />
                    {label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Settings */}
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/settings'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Settings size={18} />
          Settings
        </Link>
      </nav>

      {/* Bottom section: theme toggle + sign out */}
      <div className="px-3 py-4 border-t border-gray-800 space-y-1">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  )
}