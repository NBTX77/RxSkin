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
  LayoutGrid,
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
      { href: '/dispatch', label: 'Dispatch', icon: LayoutGrid },
      { href: '/team', label: 'Team', icon: Users },
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
      { href: '/dispatch', label: 'Dispatch', icon: LayoutGrid },
      { href: '/team', label: 'Team', icon: Users },
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
  const deptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!deptPopoverOpen) return
    const handler = (e: MouseEvent) => {
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) {
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
      <div ref={deptRef} className="relative flex flex-col px-2 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center h-8">
          <div className="w-8 flex items-center justify-center flex-shrink-0">
            {canSwitch ? (
              <button
                onClick={() => setDeptPopoverOpen(!deptPopoverOpen)}
                className={`w-8 h-8 rounded-lg ${getColorBg(config.color)} flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-white/20 transition-shadow`}
                aria-label="Switch department"
              >
                <span className="text-white font-bold text-sm">RX</span>
              </button>
            ) : (
              <div className={`w-8 h-8 rounded-lg ${getColorBg(config.color)} flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">RX</span>
              </div>
            )}
          </div>
          {isHovered && (
            <div className="flex-1 min-w-0 ml-3">
              <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">RX Skin</p>
              <p className={`text-xs font-medium truncate text-${config.color}-400`}>{config.label}</p>
            </div>
          )}
        </div>

        {/* Department popover */}
        {canSwitch && deptPopoverOpen && (
          <div className="absolute top-14 left-2 z-50 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-1.5">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Switch Department</p>
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
                <span className="font-medium">{dept.code}</span>
                <span className="text-gray-400 dark:text-gray-500 text-xs truncate">{dept.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-1.5 py-2 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = isNavItemActive(href)
          return (
            <Link
              key={href}
              href={href}
              title={!isHovered ? label : undefined}
              className={`flex items-center rounded-lg text-sm font-medium transition-colors py-2.5 ${
                active
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div className="w-8 flex items-center justify-center flex-shrink-0">
                <Icon size={18} />
              </div>
              {isHovered && (
                <span className="flex-1 text-left truncate ml-1">
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
                className={`flex items-center w-full rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-none py-2.5 ${
                  isSectionActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="w-8 flex items-center justify-center flex-shrink-0">
                  <SectionIcon size={18} />
                </div>
                {isHovered && (
                  <>
                    <span className="flex-1 text-left ml-1">{sectionName}</span>
                    <ChevronDown size={14} className={`mr-2 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
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
