'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Search, Building2, MapPin, Phone, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Company {
  id: number
  name: string
  identifier: string
  type?: string
  status?: string
  phone?: string
  website?: string
  addressLine1?: string
  city?: string
  state?: string
  zip?: string
}

function formatAddress(c: Company): string {
  const parts = [c.addressLine1, c.city, c.state].filter(Boolean)
  if (c.zip && c.state) parts[parts.length - 1] += ` ${c.zip}`
  return parts.join(', ') || ''
}

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['/api/companies', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      const res = await fetch(`/api/companies?${params}`)
      if (!res.ok) throw new Error('Failed to fetch companies')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const filteredCompanies = companies.filter((company: Company) => {
    if (statusFilter && company.status !== statusFilter) return false
    return true
  })

  return (
    <main className="flex-1 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-white">Companies</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, location, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={20} className="text-gray-400 animate-spin" />
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <Building2 size={32} className="mx-auto text-gray-700 mb-3" />
            <p className="text-gray-400">No companies found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Company</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Address</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Phone</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((company: Company) => (
                    <tr key={company.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <Link href={`/companies/${company.id}`} className="text-blue-400 hover:underline font-medium">
                          {company.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-400">{formatAddress(company) || '—'}</td>
                      <td className="py-3 px-4 text-gray-400">{company.phone || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          company.status === 'Active'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                        }`}>
                          {company.status || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filteredCompanies.map((company: Company) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.id}`}
                  className="block p-4 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-800/80 transition-colors"
                >
                  <h3 className="font-semibold text-white mb-2">{company.name}</h3>
                  {formatAddress(company) && (
                    <div className="flex items-start gap-2 text-sm text-gray-400 mb-2">
                      <MapPin size={14} className="flex-shrink-0 mt-0.5" />
                      <span>{formatAddress(company)}</span>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <Phone size={14} />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      company.status === 'Active'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>
                      {company.status || 'Unknown'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
