'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  MessageSquare,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Zap,
  Brain,
  Lightbulb,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────

interface BotConfig {
  id: string
  name: string
  description: string
  icon: LucideIcon
  enabled: boolean
  scope: string
  capabilities: string[]
}

export default function AIBotsPage() {
  const [bots, setBots] = useState<BotConfig[]>([
    {
      id: 'site-assistant',
      name: 'RX Assistant',
      description: 'General-purpose AI chatbot available to all users. Answers questions about tickets, schedules, and ConnectWise data.',
      icon: MessageSquare,
      enabled: false,
      scope: 'All users',
      capabilities: ['Ticket search & summary', 'Schedule lookup', 'Company info', 'Natural language queries'],
    },
    {
      id: 'admin-bot',
      name: 'Admin Advisor',
      description: 'AI assistant for site administrators. Analyzes behavior data, suggests UI improvements, and can implement approved changes.',
      icon: Brain,
      enabled: false,
      scope: 'Admin only',
      capabilities: ['Analyze heatmaps & click data', 'Suggest layout improvements', 'Identify dead zones', 'Generate A/B test proposals', 'Implement approved UI changes'],
    },
    {
      id: 'triage-bot',
      name: 'Ticket Triage',
      description: 'Automatically categorizes and prioritizes incoming tickets based on subject, description, and historical patterns.',
      icon: Zap,
      enabled: false,
      scope: 'IT & SI departments',
      capabilities: ['Auto-categorize tickets', 'Suggest priority', 'Recommend assignment', 'Detect duplicate tickets'],
    },
    {
      id: 'insights-bot',
      name: 'Insights Engine',
      description: 'Analyzes usage patterns across all integrations and surfaces proactive recommendations for the team.',
      icon: Lightbulb,
      enabled: false,
      scope: 'Leadership + Admin',
      capabilities: ['Utilization trends', 'Ticket pattern detection', 'SLA risk alerts', 'Cross-platform anomaly detection'],
    },
  ])

  const toggleBot = (id: string) => {
    setBots(prev => prev.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI & Bots</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure AI assistants, chatbots, and automated intelligence features.
          AI has access to behavior analytics data to help improve the site.
        </p>
      </div>

      {/* Global AI Settings */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Global AI Settings</h3>
        </div>

        <div className="space-y-4">
          <ToggleRow
            label="Enable AI features"
            description="Master switch for all AI functionality in RX Skin"
            enabled={true}
          />
          <ToggleRow
            label="AI access to analytics data"
            description="Allow AI to read click tracking, heatmaps, and behavior data to make site improvement suggestions"
            enabled={true}
          />
          <ToggleRow
            label="AI can propose UI changes"
            description="Admin Advisor can generate change proposals. All changes require admin approval before implementation."
            enabled={false}
          />

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">AI Provider</label>
            <select className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500">
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="openai">OpenAI (GPT)</option>
              <option value="custom">Custom API</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">API Key</label>
            <input
              type="password"
              placeholder="sk-..."
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-700 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-[10px] text-gray-600 mt-1">Stored encrypted. Used for all AI features.</p>
          </div>
        </div>
      </div>

      {/* Bot Configurations */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bot Configurations</h3>

        {bots.map(bot => {
          const Icon = bot.icon
          return (
            <div key={bot.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    bot.enabled ? 'bg-cyan-600/20' : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Icon size={20} className={bot.enabled ? 'text-cyan-400' : 'text-gray-500'} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{bot.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Scope: {bot.scope}</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleBot(bot.id)}
                  className="flex items-center gap-1.5"
                >
                  {bot.enabled ? (
                    <ToggleRight size={28} className="text-cyan-400" />
                  ) : (
                    <ToggleLeft size={28} className="text-gray-600" />
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 mb-3">{bot.description}</p>

              <div className="flex flex-wrap gap-2">
                {bot.capabilities.map(cap => (
                  <span key={cap} className="text-[10px] px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700/50">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Chatbot Placement */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chatbot Placement</h3>
        </div>

        <div className="space-y-4">
          <ToggleRow
            label="Floating chat bubble"
            description="Show a chat bubble in the bottom-right corner of the dashboard"
            enabled={false}
          />
          <ToggleRow
            label="Inline in ticket detail"
            description="Show an AI assistant panel in the ticket detail sidebar"
            enabled={false}
          />
          <ToggleRow
            label="Command palette integration"
            description="Allow natural language queries in the Ctrl+K search"
            enabled={false}
          />
        </div>
      </div>
    </div>
  )
}

// ── Shared toggle component ──────────────────────────────────

function ToggleRow({ label, description, enabled: defaultEnabled }: { label: string; description: string; enabled: boolean }) {
  const [enabled, setEnabled] = useState(defaultEnabled)

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-gray-700 dark:text-gray-300">{label}</p>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
          enabled ? 'bg-blue-600' : 'bg-gray-700'
        }`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          enabled ? 'left-5' : 'left-0.5'
        }`} />
      </button>
    </div>
  )
}
