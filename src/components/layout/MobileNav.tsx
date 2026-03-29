'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Sun,
  Ticket,
  Calendar,
  Building2,
  Search,
  Map,
  MoreHorizontal,
  FolderKanban,
  DollarSign,
  Package,
  LayoutDashboard,
  X,
  ChevronRight,
  Users,
} from 'lucide-react'
import { useDepartment } from '@/components/department/DepartmentProvider'
import type { DepartmentCode } from '@/types'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

type MobileNavConfig = {
  [key in DepartmentCode]: {
    primary: NavItem[]
    secondary: NavItem[]
  }
}

const mobileNavConfig: MobileNavConfig = {
  IT: {
    primary: [
      { href: '/dashboard', label: 'My Day', icon: Sun },
      { href: '/tickets', label: 'Tickets', icon: Ticket },
      { href: '/schedule', label: 'Schedule', icon: Calendar },
      { href: '/fleet', label: 'Fleet', icon: Map },
    ],
    secondary: [
      { href: '/projects', label: 'Projects', icon: FolderKanban },
      { href: '/team', label: 'Team', icon: Users },
      { href: '/dispatch', label: 'Dispatch', icon: LayoutDashboard },
    ],
  },
  SI: {
    primary: [
      { href: '/dashboard', label: 'My Day', icon: Sun },
      { href: '/projects', label: 'Projects', icon: FolderKanban },
      { href: '/schedule', label: 'Schedule', icon: Calendar },
      { href: '/fleet', label: 'Fleet', icon: Map },
    ],
    secondary: [
      { href: '/tickets', label: 'Service Queue', icon: Ticket },
      { href: '/team', label: 'Team', icon: Users },
      { href: '/dispatch', label: 'Dispatch', icon: LayoutDashboard },
    ],
  },
  AM: {
    primary: [
      { href: '/dashboard', label: 'My Day', icon: Sun },
      { href: '/companies', label: 'My Accounts', icon: Building2 },
      { href: '/tickets', label: 'Tickets', icon: Ticket },
      { href: '/cbr', label: 'CBR', icon: FolderKanban },
    ],
    secondary: [
      { href: '/projects', label: 'Projects', icon: FolderKanban },
      { href: '/agreements', label: 'Agreements', icon: DollarSign },
      { href: '/opportunities', label: 'Opportunities', icon: ChevronRight },
    ],
  },
  GA: {
    primary: [
      { href: '/dashboard', label: 'My Day', icon: Sun },
      { href: '/invoices', label: 'Invoices', icon: DollarSign },
      { href: '/purchase-orders', label: 'POs', icon: Package },
      { href: '/projects', label: 'Projects', icon: FolderKanban },
    ],
    secondary: [
      { href: '/agreements', label: 'Agreements', icon: FolderKanban },
      { href: '/fleet', label: 'Fleet', icon: Map },
    ],
  },
  LT: {
    primary: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/projects', label: 'Projects', icon: FolderKanban },
      { href: '/financials', label: 'Financials', icon: DollarSign },
      { href: '/fleet', label: 'Fleet', icon: Map },
    ],
    secondary: [
      { href: '/departments', label: 'Departments', icon: Users },
      { href: '/tickets', label: 'All Tickets', icon: Ticket },
      { href: '/cbr', label: 'CBR', icon: FolderKanban },
    ],
  },
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/')
}

// ── Bottom Sheet ────────────────────────────────────────────────

function BottomSheet({
  open,
  onClose,
  secondary,
}: {
  open: boolean
  onClose: () => void
  secondary: NavItem[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { department, config, canSwitch, switchDepartment, allDepartments } = useDepartment()
  const sheetRef = useRef<HTMLDivElement>(null)

  // Close on outside tap
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  // Close on escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const deptColorMap: Record<string, string> = {
    blue: 'bg-blue-600',
    cyan: 'bg-cyan-600',
    green: 'bg-green-600',
    orange: 'bg-orange-600',
    purple: 'bg-purple-600',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`lg:hidden fixed left-0 right-0 bottom-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">More</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={() => {
              onClose()
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }))
            }}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Search size={18} />
            <span>Search…</span>
            <span className="ml-auto text-xs text-gray-400 dark:text-gray-600 font-mono">⌘K</span>
          </button>
        </div>

        {/* Secondary nav */}
        {secondary.length > 0 && (
          <div className="px-4 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">More Pages</p>
            <div className="space-y-1">
              {secondary.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Department switcher */}
        {canSwitch && (
          <div className="px-4 py-2 pb-6">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">Switch Department</p>
            <div className="space-y-1">
              {allDepartments.map(dept => (
                <button
                  key={dept.code}
                  onClick={() => {
                    switchDepartment(dept.code)
                    onClose()
                    const defaultHref = mobileNavConfig[dept.code]?.primary[0]?.href ?? '/dashboard'
                    router.push(defaultHref)
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    dept.code === department
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg ${deptColorMap[dept.color] ?? 'bg-blue-600'} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-bold">{dept.code}</span>
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-medium truncate">{dept.code}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{dept.label}</p>
                  </div>
                  {dept.code === department && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Safe area spacer */}
        <div className="h-4" />
      </div>
    </>
  )
}

// ── Main Component ──────────────────────────────────────────────

export function MobileNav() {
  const pathname = usePathname()
  const { department } = useDepartment()
  const [sheetOpen, setSheetOpen] = useState(false)

  const config = mobileNavConfig[department] ?? mobileNavConfig.IT
  const primaryItems = config.primary
  const secondaryItems = config.secondary

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-around h-16 px-2">
          {primaryItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors min-w-0 ${
                  active ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs font-medium truncate">{label}</span>
              </Link>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setSheetOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <MoreHorizontal size={20} />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        secondary={secondaryItems}
      />
    </>
  )
}
