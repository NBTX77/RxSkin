'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
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

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: string
}
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
          { href: '/ops/fleet-map', label: 'Fleet Map', icon: Map },          { href: '/ops/analytics', label: 'Analytics', icon: BarChart3 },
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
  },  GA: {
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

export function Sidebar() {
  const pathname = usePathname()
  const { department, config, canSwitch, switchDepartment, allDepartments } = useDepartment()
  const [expandedSection, setExpandedSection] = useState<string | null>(pathname.startsWith('/ops') ? 'Ops' : null)
  const [deptSwitcherOpen, setDeptSwitcherOpen] = useState(false)
  const deptConfig = departmentNav[department]
  const navItems = deptConfig?.items || []
  const expandableSections = deptConfig?.expandableSections || {}

  const getColorBg = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-600',
      cyan: 'bg-cyan-600',
      green: 'bg-green-600',
      orange: 'bg-orange-600',
      purple: 'bg-purple-600',
    }
    return colorMap[color] || 'bg-blue-600'
  }

  const isNavItemActive = (href: string): boolean => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-40">
      {/* Logo + Department Badge */}
      <div className="flex flex-col px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-lg ${getColorBg(config.color)} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-bold text-sm">RX</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">RX Skin</p>
            <p className="text-gray-500 text-xs">ConnectWise Portal</p>
          </div>
        </div>        <div className="pl-0.5">
          <p className={`text-xs font-medium px-2 py-1 rounded w-fit text-${config.color}-300 bg-${config.color}-900/40`}>
            {config.name} Department
          </p>
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
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = isNavItemActive(href)
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
              <span className="flex-1 text-left">
                {label}
                {badge && <span className="text-xs text-gray-500 ml-1">{badge}</span>}
              </span>
            </Link>
          )
        })}
        {/* Expandable sections (e.g., Ops for IT) */}
        {Object.entries(expandableSections).map(([sectionName, section]) => {
          const isExpanded = expandedSection === sectionName
          const isSectionActive = section.items.some(item => isNavItemActive(item.href))
          const SectionIcon = section.icon

          return (
            <div key={sectionName}>
              <button
                onClick={() => setExpandedSection(isExpanded ? null : sectionName)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isSectionActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <SectionIcon size={18} />
                <span className="flex-1 text-left">{sectionName}</span>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {isExpanded && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {section.items.map(({ href, label, icon: Icon }) => {
                    const active = isNavItemActive(href)
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
          )
        })}
      </nav>