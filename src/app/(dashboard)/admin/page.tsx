'use client'

import { Link2, Users, Building2, ScrollText, Bot, BarChart3 } from 'lucide-react'
import Link from 'next/link'

const adminCards = [
  {
    href: '/admin/integrations',
    icon: Link2,
    label: 'Integrations',
    description: 'Manage API credentials for ConnectWise, Automate, Control, and all connected platforms',
    stat: '10 platforms',
    color: 'blue',
  },
  {
    href: '/admin/users',
    icon: Users,
    label: 'Users',
    description: 'Manage user accounts, roles, departments, and permissions',
    stat: '—',
    color: 'green',
  },
  {
    href: '/admin/tenant',
    icon: Building2,
    label: 'Tenant Settings',
    description: 'Company name, logo, CW board mappings, cache settings, and rate limits',
    stat: 'RX Technology',
    color: 'purple',
  },
  {
    href: '/admin/ai',
    icon: Bot,
    label: 'AI & Bots',
    description: 'Configure AI assistants, chatbot settings, and site improvement suggestions',
    stat: 'New',
    color: 'cyan',
  },
  {
    href: '/admin/analytics',
    icon: BarChart3,
    label: 'Analytics',
    description: 'Behavior tracking, heatmaps, click analytics, and AI-powered site insights',
    stat: 'New',
    color: 'orange',
  },
  {
    href: '/admin/audit-log',
    icon: ScrollText,
    label: 'Audit Log',
    description: 'View all API calls, credential access, user logins, and admin actions',
    stat: '—',
    color: 'gray',
  },
]

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-600/15', text: 'text-blue-400', border: 'border-blue-500/20' },
  green: { bg: 'bg-green-600/15', text: 'text-green-400', border: 'border-green-500/20' },
  purple: { bg: 'bg-purple-600/15', text: 'text-purple-400', border: 'border-purple-500/20' },
  cyan: { bg: 'bg-cyan-600/15', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  orange: { bg: 'bg-orange-600/15', text: 'text-orange-400', border: 'border-orange-500/20' },
  gray: { bg: 'bg-gray-600/15', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/20' },
}

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Manage integrations, users, and system settings for your RX Skin instance.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {adminCards.map(({ href, icon: Icon, label, description, stat, color }) => {
          const colors = colorMap[color]
          return (
            <Link
              key={href}
              href={href}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-900 p-5 hover:border-gray-700 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                  <Icon size={20} className={colors.text} />
                </div>
                <span className="text-[10px] text-gray-600 uppercase tracking-wider">{stat}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-400 transition-colors">{label}</p>
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
