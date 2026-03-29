'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
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

export function Sidebar() {
  const pathname = usePathname()
  const { department, config, canSwitch, switchDepartment, allDepartments } = useDepartment()
  const [expandedSection, setExpandedSection] = useState<string | null>(pathname.startsWith('/ops') ? 'Ops' : null)
  const [isHovered, setIsHovered] = useState(false)
  const [deptPopoverOpen, setDeptPopoverOpen] = useState(false)
  const logoRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!deptPopoverOpen) return
    const handler = (e: MouseEvent) => {
      if (logoRef.current && !logoRef.current.contains(e.target as Node)) {
        setDeptPopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [deptPopoverOpen])

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
    <aside
      className={`hidden lg:flex flex-col fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 transition-all duration-200 ease-in-out overflow-hidden ${
        isHovered ? 'w-52' : 'w-12'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo + Department Badge */}
      <div className="relative flex flex-col px-2 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className={`flex items-center gap-3 ${isHovered ? 'px-3' : 'justify-center'}`}>
          {canSwitch ? (
            <button
              ref={logoRef}
              onClick={() => setDeptPopoverOpen(!deptPopoverOpen)}
              className={`w-8 h-8 rounded-lg ${getColorBg(config.color)} flex items-center justify-center flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-white/20 transition-shadow`}
              aria-label="Switch department"
            >
              <span className="text-white font-bold text-sm">RX</span>
            </button>
          ) : (
            <div className={`w-8 h-8 rounded-lg ${getColorBg(config.color)} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white font-bold text-sm">RX</span>
            </div>
          )}
          {isHovered && (
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">RX Skin</p>
              <p className="text-gray-500 text-xs truncate">ConnectWise Portal</p>
            </div>
          )}
        </div>
        {isHovered && (
          <div className="pl-3 mt-2">
            <p className={`text-xs font-medium px-2 py-1 rounded w-fit text-${config.color}-300 bg-${config.color}-900/40 truncate`}>
              {config.name} Department
            </p>
          </div>
        )}

        {/* Department popover */}
        {canSwitch && deptPopoverOpen && (
          <div className="absolute top-14 left-2 z-50 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-1.5">
            {allDepartments.map(dept => (
              <button
                key={dept.code}
                onClick={() => { switchDepartment(dept.code); setDeptPopoverOpen(false) }}
                className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                  dept.code === department
                    ? 'bg-blue-500/10 text-blue-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${getColorBg(dept.color)}`} />
                {dept.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search shortcut — hidden when collapsed */}
      {isHovered && (
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={() => {
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }))
            }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/50 text-gray-500 text-sm hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
          >
            <Search size={14} />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-600">
              Ctrl K
            </kbd>
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-1.5 py-2 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = isNavItemActive(href)
          return (
            <Link
              key={href}
              href={href}
              title={!isHovered ? label : undefined}
              className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
                isHovered ? 'px-3 py-2.5' : 'justify-center py-2.5'
              } ${
                active
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {isHovered && (
                <span className="flex-1 text-left truncate">
                  {label}
                  {badge && <span className="text-xs text-gray-500 ml-1">{badge}</span>}
                </span>
              )}
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
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${sectionName}`}
                title={!isHovered ? sectionName : undefined}
                className={`flex items-center gap-3 w-full rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-none ${
                  isHovered ? 'px-3 py-2.5' : 'justify-center py-2.5'
                } ${
                  isSectionActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <SectionIcon size={18} className="flex-shrink-0" />
                {isHovered && (
                  <>
                    <span className="flex-1 text-left">{sectionName}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                  </>
                )}
              </button>

              {isHovered && (
                <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
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
                              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                          }`}
                        >
                          <Icon size={15} />
                          {label}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom: minimal branding */}
      {isHovered && (
        <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800">
          <p className="text-[10px] text-gray-500 dark:text-gray-600 text-center tracking-wider uppercase">RX Skin v0.1</p>
        </div>
      )}
    </aside>
  )
}
