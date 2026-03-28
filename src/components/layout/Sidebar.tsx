'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
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
  Menu,
  X,
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
  const [open, setOpen] = useState(true)
  const sidebarRef = useRef<HTMLElement>(null)

  const isOpsActive = pathname.startsWith('/ops')

  // Close sidebar on route change on smaller screens
  useEffect(() => {
    // Keep sidebar open on large screens by default
  }, [pathname])

  // Close on click outside when open
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        open &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('[data-sidebar-toggle]')
      ) {
        // Don't auto-close — user controls it
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <>
      {/* Toggle button — always visible on desktop */}
      <button
        data-sidebar-toggle
        onClick={() => setOpen(!open)}
        className="hidden lg:flex fixed top-3 left-3 z-50 items-center justify-center w-9 h-9 rounded-lg bg-gray-900/80 backdrop-blur-md border border-gray-700/40 text-gray-400 hover:text-white hover:bg-gray-800/90 transition-all shadow-lg"
        title={open ? 'Hide navigation' : 'Show navigation'}
      >
        {open ? <X size={16} /> : <Menu size={16} />}
      </button>

      {/* Floating sidebar card */}
      <aside
        ref={sidebarRef}
        className={`hidden lg:flex flex-col fixed left-3 top-14 z-40 w-48 max-h-[calc(100vh-72px)] bg-gray-900/90 backdrop-blur-xl border border-gray-700/40 rounded-xl shadow-2xl transition-all duration-200 ${
          open
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 -translate-x-4 pointer-events-none'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-700/30">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs" style={{ color: '#fff' }}>RX</span>
          </div>
          <div>
            <p className="text-white font-semibold text-xs">RX Skin</p>
            <p className="text-gray-500 text-[10px]">ConnectWise Portal</p>
          </div>
        </div>

        {/* Search shortcut */}
        <div className="px-2.5 pt-2.5 pb-1">
          <button
            onClick={() => {
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }))
            }}
            className="flex items-center gap-1.5 w-full px-2.5 py-1.5 rounded-lg bg-gray-800/40 border border-gray-700/30 text-gray-500 text-xs hover:bg-gray-800/60 hover:text-gray-400 transition-colors"
          >
            <Search size={12} />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="text-[9px] px-1 py-0.5 rounded bg-gray-800/60 border border-gray-700/30 text-gray-600">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-1.5 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
          {/* Ops expandable section */}
          <div>
            <button
              onClick={() => setOpsExpanded(!opsExpanded)}
              className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                isOpsActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Radar size={15} />
              <span className="flex-1 text-left">Ops</span>
              {opsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>

            {opsExpanded && (
              <div className="ml-3 mt-0.5 space-y-0.5">
                {opsSubItems.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        active
                          ? 'text-blue-400 bg-blue-600/10'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
                      }`}
                    >
                      <Icon size={13} />
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
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              pathname === '/settings'
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <Settings size={15} />
            Settings
          </Link>
        </nav>

        {/* Bottom section: theme toggle + sign out */}
        <div className="px-2.5 py-2.5 border-t border-gray-700/30 space-y-0.5">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
