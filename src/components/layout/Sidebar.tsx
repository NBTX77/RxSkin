'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
<<<<<<< HEAD
import { useState, useRef } from 'react'
=======
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
>>>>>>> 292fbbe (chore: delete stale config duplicates, fix TypeScript errors)
import {
  Sun,
  Ticket,
  Calendar,
  Building2,
  Settings,
  Search,
  Radar,
  ChevronDown,
  ChevronRight,
  Map,
  BarChart3,
  Clock,
<<<<<<< HEAD
  Menu,
  GripVertical,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useTheme } from '@/components/theme/ThemeProvider'
import { useDraggable } from '@/hooks/useDraggable'
=======
  FolderKanban,
  FileCheck,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  LayoutDashboard,
  Users,
  ChevronUp,
} from 'lucide-react'
import { useDepartment } from '@/components/department/DepartmentProvider'
import type { DepartmentCode } from '@/types'
>>>>>>> 292fbbe (chore: delete stale config duplicates, fix TypeScript errors)

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: string
}

<<<<<<< HEAD
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

  const { position, isDragging, onDragStart } = useDraggable({
    storageKey: 'rx-sidebar-pos',
    defaultPosition: { x: 12, y: 12 },
  })

  const isOpsActive = pathname.startsWith('/ops')

  return (
    <>
      {/* Single Menu toggle button — fixed top-left, always visible on desktop */}
      {!open && (
        <button
          data-sidebar-toggle
          onClick={() => setOpen(true)}
          className="hidden lg:flex fixed top-3 left-3 z-[1100] items-center justify-center w-9 h-9 rounded-lg bg-gray-900/80 backdrop-blur-md border border-gray-700/40 text-gray-400 hover:text-white hover:bg-gray-800/90 transition-all shadow-lg"
          title="Show navigation"
        >
          <Menu size={16} />
        </button>
      )}

      {/* Floating, draggable sidebar card */}
      <aside
        ref={sidebarRef}
        style={{
          left: position.x,
          top: position.y,
          cursor: isDragging ? 'grabbing' : undefined,
        }}
        className={`hidden lg:flex flex-col fixed z-[1100] w-48 max-h-[calc(100vh-24px)] bg-gray-900/90 backdrop-blur-xl border border-gray-700/40 rounded-xl shadow-2xl transition-opacity duration-200 ${
          open
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
        } ${isDragging ? 'select-none' : ''}`}
      >
        {/* Drag handle header with integrated menu toggle */}
        <div className="flex items-center gap-1 px-1.5 py-1.5 border-b border-gray-700/30">
          {/* Drag grip */}
          <div
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
            className="flex items-center justify-center w-6 h-6 rounded cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 transition-colors"
            title="Drag to reposition"
          >
            <GripVertical size={12} />
          </div>

          {/* Logo */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-[10px]" style={{ color: '#fff' }}>RX</span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-[11px] leading-tight">RX Skin</p>
              <p className="text-gray-500 text-[9px] leading-tight truncate">ConnectWise Portal</p>
            </div>
          </div>

          {/* Close / collapse button (Menu icon) */}
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-6 h-6 rounded text-gray-500 hover:text-white hover:bg-gray-800/50 transition-colors"
            title="Hide navigation"
          >
            <Menu size={13} />
          </button>
        </div>

        {/* Search shortcut */}
        <div className="px-2.5 pt-2 pb-1">
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
=======
type DepartmentNavConfig = {
  [key in DepartmentCode]?: {
    dashboardLabel: string
    dashboardIcon: LucideIcon
    items: NavItem[]
    expandableSections?: {
      [sectionName: string]: {
        icon: LucideIcon
        items: NavItem[]
      }
    }
  }
}
const departmentNav: DepartmentNavConfig = {
  IT: {
    dashboardLabel: 'My Day',
    dashboardIcon: Sun,
    items: [
      { href: '/dashboard', label: 'My Day', icon: Sun },
      { href: '/tickets', label: 'Tickets', icon: Ticket },
      { href: '/projects', label: 'Projects', icon: FolderKanban },
      { href: '/schedule', label: 'Schedule', icon: Calendar },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
    expandableSections: {
      Ops: {
        icon: Radar,
        items: [
          { href: '/ops/fleet-map', label: 'Fleet Map', icon: Map },
          { href: '/ops/analytics', label: 'Analytics', icon: BarChart3 },
          { href: '/ops/holds', label: 'Schedule Holds', icon: Clock },
        ],
      },
    },
  },
  SI: {
    dashboardLabel: 'My Day',
    dashboardIcon: Sun,
    items: [
      { href: '/dashboard', label: 'My Day', icon: Sun },
      { href: '/projects', label: 'Project Board', icon: FolderKanban },
      { href: '/tickets', label: 'Service Queue', icon: Ticket },
      { href: '/schedule', label: 'Job Scheduler', icon: Calendar },
      { href: '/ops/fleet-map', label: 'Fleet Map', icon: Map },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
  AM: {
    dashboardLabel: 'My Day',
    dashboardIcon: Sun,
    items: [
      { href: '/dashboard', label: 'My Day', icon: Sun },
      { href: '/companies', label: 'My Accounts', icon: Building2 },
      { href: '/projects', label: 'Projects', icon: FolderKanban, badge: '(view)' },
      { href: '/agreements', label: 'Agreements', icon: FileCheck },
      { href: '/opportunities', label: 'Opportunities', icon: TrendingUp },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
  GA: {
    dashboardLabel: 'My Day',
    dashboardIcon: Sun,
    items: [
      { href: '/dashboard', label: 'My Day', icon: Sun },
      { href: '/projects', label: 'Projects', icon: FolderKanban, badge: '($)' },
      { href: '/invoices', label: 'Invoices', icon: DollarSign },
      { href: '/purchase-orders', label: 'Purchase Orders', icon: Package },
      { href: '/agreements', label: 'Agreements', icon: FileCheck },
      { href: '/tickets', label: 'Procurement', icon: ShoppingCart },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
  LT: {
    dashboardLabel: 'Executive Dashboard',
    dashboardIcon: LayoutDashboard,
    items: [
      { href: '/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
      { href: '/tickets', label: 'All Tickets', icon: Ticket },
      { href: '/projects', label: 'All Projects', icon: FolderKanban },
      { href: '/departments', label: 'Departments', icon: Users },
      { href: '/financials', label: 'Financials', icon: DollarSign },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
}
>>>>>>> 292fbbe (chore: delete stale config duplicates, fix TypeScript errors)
