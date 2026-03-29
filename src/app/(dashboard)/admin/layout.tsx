'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import {
  Shield,
  Link2,
  Users,
  Building2,
  ScrollText,
  Bot,
  BarChart3,
  ArrowLeft,
} from 'lucide-react'
import type { UserRole } from '@/types'

const adminNav = [
  { href: '/admin', label: 'Overview', icon: Shield, exact: true },
  { href: '/admin/integrations', label: 'Integrations', icon: Link2, exact: false },
  { href: '/admin/users', label: 'Users', icon: Users, exact: false },
  { href: '/admin/tenant', label: 'Tenant Settings', icon: Building2, exact: false },
  { href: '/admin/ai', label: 'AI & Bots', icon: Bot, exact: false },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, exact: false },
  { href: '/admin/audit-log', label: 'Audit Log', icon: ScrollText, exact: false },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Guard: admin only
  if (status === 'loading') return null
  if (session?.user?.role !== ('ADMIN' as UserRole)) {
    redirect('/dashboard')
  }

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="space-y-6">
      {/* Admin header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-300 transition-colors"
        >
          <ArrowLeft size={14} />
          Dashboard
        </Link>
        <span className="text-gray-700">/</span>
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-orange-400" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Panel</h1>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Admin sidebar nav */}
        <nav className="lg:w-56 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {adminNav.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-orange-600/15 text-orange-400 border border-orange-500/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Admin content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
