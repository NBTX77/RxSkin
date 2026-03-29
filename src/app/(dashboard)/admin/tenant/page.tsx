'use client'

import { useState } from 'react'
import { Building2, Globe, Database, Gauge, Save } from 'lucide-react'

export default function TenantSettingsPage() {
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Tenant Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Configure your RX Skin instance.</p>
      </div>

      {/* Company Info */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 size={16} className="text-purple-400" />
          <h3 className="text-sm font-semibold text-gray-300">Company Information</h3>
        </div>

        <FormField label="Company Name" defaultValue="RX Technology" />
        <FormField label="Slug" defaultValue="rx-technology" hint="Used in URLs and cache keys" />
        <FormField label="Primary Domain" defaultValue="rxtech.com" />

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Logo</label>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">RX</span>
            </div>
            <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg border border-gray-700 transition-colors">
              Upload Logo
            </button>
          </div>
        </div>
      </div>

      {/* ConnectWise Board Mappings */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Globe size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-300">ConnectWise Board Mappings</h3>
        </div>
        <p className="text-xs text-gray-500">Map CW service boards to departments. Separate multiple board names with commas.</p>

        <FormField label="IT Department Boards" defaultValue="Managed Services, Engineering, Alerts/Monitoring, IT Installations" />
        <FormField label="SI Department Boards" defaultValue="SI (Service), SI (Security), SI (Communication)" />
        <FormField label="AM Department Boards" defaultValue="Opportunities" />
        <FormField label="GA Department Boards" defaultValue="Procurement" />
      </div>

      {/* Cache & Performance */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Gauge size={16} className="text-orange-400" />
          <h3 className="text-sm font-semibold text-gray-300">Cache & Performance</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Ticket Cache TTL (seconds)" defaultValue="30" type="number" />
          <FormField label="Computer Cache TTL (seconds)" defaultValue="30" type="number" />
          <FormField label="Script Cache TTL (seconds)" defaultValue="300" type="number" />
          <FormField label="Company Cache TTL (seconds)" defaultValue="60" type="number" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="CW API Rate Limit (req/sec)" defaultValue="40" type="number" />
          <FormField label="Graph API Rate Limit (req/sec)" defaultValue="10" type="number" />
        </div>
      </div>

      {/* Database */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Database size={16} className="text-green-400" />
          <h3 className="text-sm font-semibold text-gray-300">Database</h3>
        </div>

        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Provider</span>
            <span className="text-gray-300">PostgreSQL (Supabase)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tenant Isolation</span>
            <span className="text-gray-300">RLS + tenant_id</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Encryption</span>
            <span className="text-gray-300">AES-256-GCM (at rest)</span>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          <Save size={14} />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

function FormField({
  label,
  defaultValue,
  hint,
  type = 'text',
}: {
  label: string
  defaultValue: string
  hint?: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
      />
      {hint && <p className="text-[10px] text-gray-600 mt-1">{hint}</p>}
    </div>
  )
}
