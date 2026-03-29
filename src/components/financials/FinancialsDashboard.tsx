'use client'

// ============================================================
// FinancialsDashboard — RX Skin
// Comprehensive financial overview: KPIs, revenue trends,
// invoice aging, recent invoices, agreements, and POs.
// Uses live ConnectWise data via /api/financials BFF route.
// ============================================================

import {
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import {
  DollarSign,
  FileText,
  TrendingUp,
  Handshake,
  ShoppingCart,
  PieChart,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Building2,
} from 'lucide-react'
import { KPICard } from '@/components/ui/KPICard'
import { useFinancialsData } from '@/hooks/useFinancialsData'
import type {
  InvoiceSummary,
  AgreementSummary,
  PurchaseOrderSummary,
  RevenueMonth,
  AgingBucket,
} from '@/hooks/useFinancialsData'

// ── Helpers ──────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '--'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// ── Custom Tooltips ──────────────────────────────────────────

interface TooltipPayloadItem {
  value: number
  dataKey: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function RevenueTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Revenue: {formatCurrencyFull(payload[0].value)}
      </p>
    </div>
  )
}

function AgingTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Outstanding: {formatCurrencyFull(payload[0].value)}
      </p>
    </div>
  )
}

// ── Loading Skeleton ─────────────────────────────────────────

function FinancialsSkeleton() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 animate-pulse">
        {/* Header skeleton */}
        <div>
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded mt-2" />
        </div>

        {/* KPI strip skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4"
            >
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-lg mb-3" />
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
              <div className="h-7 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-6"
            >
              <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
              <div className="h-[250px] bg-gray-100 dark:bg-gray-800/50 rounded" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-6">
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800/50 rounded mb-2" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Error State ──────────────────────────────────────────────

function FinancialsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const is403 = message.includes('403') || message.includes('permission')
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4">
        <AlertTriangle size={32} className="text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {is403 ? 'Data unavailable' : 'Failed to load financial data'}
      </h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-4">
        {is403
          ? 'Data unavailable - check API permissions. Ensure the CW API member has access to finance and procurement endpoints.'
          : message}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </div>
  )
}

// ── Revenue Chart ────────────────────────────────────────────

function RevenueChart({ data }: { data: RevenueMonth[] }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Revenue Trend (Last 6 Months)
      </h2>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 sm:p-6">
        {data.every((d) => d.revenue === 0) ? (
          <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
            No revenue data available for the last 6 months
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="month"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={{ stroke: '#D1D5DB' }}
                tickLine={{ stroke: '#D1D5DB' }}
              />
              <YAxis
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={{ stroke: '#D1D5DB' }}
                tickLine={{ stroke: '#D1D5DB' }}
                tickFormatter={(v: number) => formatCurrency(v)}
              />
              <Tooltip content={<RevenueTooltip />} cursor={{ fill: 'rgba(107,114,128,0.1)' }} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

// ── Aging Chart ──────────────────────────────────────────────

function AgingChart({ data }: { data: AgingBucket[] }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Invoice Aging
      </h2>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 sm:p-6">
        {data.every((d) => d.total === 0) ? (
          <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
            No outstanding invoices
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                type="number"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={{ stroke: '#D1D5DB' }}
                tickLine={{ stroke: '#D1D5DB' }}
                tickFormatter={(v: number) => formatCurrency(v)}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={{ stroke: '#D1D5DB' }}
                tickLine={{ stroke: '#D1D5DB' }}
                width={70}
              />
              <Tooltip content={<AgingTooltip />} cursor={{ fill: 'rgba(107,114,128,0.1)' }} />
              <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`aging-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Aging legend with counts */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {data.map((bucket) => (
            <div key={bucket.label} className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: bucket.color }} />
                <span className="text-xs text-gray-500">{bucket.range}</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(bucket.total)}
              </p>
              <p className="text-xs text-gray-500">{bucket.count} invoice{bucket.count !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Invoices Table ───────────────────────────────────────────

function InvoicesTable({ invoices }: { invoices: InvoiceSummary[] }) {
  if (invoices.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-6 text-center text-gray-400 text-sm">
        No invoices found
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden">
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Invoice #
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Company
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Balance
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Due Date
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {inv.invoiceNumber}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
                  {inv.companyName}
                </td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">
                  {formatCurrencyFull(inv.total)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={
                      inv.balance > 0
                        ? 'text-red-500 font-medium'
                        : 'text-emerald-500 font-medium'
                    }
                  >
                    {formatCurrencyFull(inv.balance)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {formatDate(inv.dueDate)}
                </td>
                <td className="px-4 py-3">
                  <InvoiceStatusBadge status={inv.status} isOverdue={inv.isOverdue} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
        {invoices.map((inv) => (
          <div key={inv.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900 dark:text-white">{inv.invoiceNumber}</span>
              <InvoiceStatusBadge status={inv.status} isOverdue={inv.isOverdue} />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{inv.companyName}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Total: {formatCurrencyFull(inv.total)}</span>
              <span className={inv.balance > 0 ? 'text-red-500 font-medium' : 'text-emerald-500 font-medium'}>
                Bal: {formatCurrencyFull(inv.balance)}
              </span>
            </div>
            <p className="text-xs text-gray-500">Due: {formatDate(inv.dueDate)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function InvoiceStatusBadge({ status, isOverdue }: { status: string; isOverdue: boolean }) {
  if (isOverdue) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
        Overdue
      </span>
    )
  }

  const lower = status.toLowerCase()
  if (lower.includes('paid') || lower.includes('closed')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
        {status}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
      {status}
    </span>
  )
}

// ── Agreements Grid ──────────────────────────────────────────

function AgreementsGrid({ agreements }: { agreements: AgreementSummary[] }) {
  if (agreements.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-6 text-center text-gray-400 text-sm">
        No active agreements found
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {agreements.slice(0, 12).map((agr) => (
        <div
          key={agr.id}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate mb-1">
            {agr.name}
          </h4>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
            <Building2 className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{agr.companyName}</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Type</span>
              <span className="text-gray-900 dark:text-white font-medium">{agr.typeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Amount</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {formatCurrencyFull(agr.billAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Period</span>
              <span className="text-gray-900 dark:text-white font-medium capitalize">
                {agr.periodType || '--'}
              </span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-gray-100 dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Period
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {formatDate(agr.startDate)} - {agr.noEndingDate ? 'Ongoing' : formatDate(agr.endDate)}
              </span>
            </div>
          </div>
        </div>
      ))}
      {agreements.length > 12 && (
        <div className="bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/50 rounded-lg p-4 flex items-center justify-center text-sm text-gray-500">
          +{agreements.length - 12} more agreements
        </div>
      )}
    </div>
  )
}

// ── Purchase Orders List ─────────────────────────────────────

function PurchaseOrdersList({ orders }: { orders: PurchaseOrderSummary[] }) {
  if (orders.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg p-6 text-center text-gray-400 text-sm">
        No open purchase orders
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden">
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {orders.map((po) => (
          <div
            key={po.id}
            className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-4 h-4 text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{po.poNumber}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{po.vendorName}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrencyFull(po.total)}
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                {po.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────

export function FinancialsDashboard() {
  const { data, isLoading, isError, error, refetch } = useFinancialsData()

  if (isLoading) return <FinancialsSkeleton />

  if (isError) {
    return (
      <FinancialsError
        message={error instanceof Error ? error.message : 'An unexpected error occurred'}
        onRetry={() => refetch()}
      />
    )
  }

  if (!data) return null

  const { kpis, recentInvoices, activeAgreements, openPurchaseOrders, revenueByMonth, agingBuckets, errors } = data

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* Partial failure warnings */}
        {errors.length > 0 && (
          <div className="flex items-start gap-2 px-4 py-2.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50">
            <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              {errors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financials</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Live data from ConnectWise Manage
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* KPI STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <KPICard
            label="Outstanding Balance"
            value={formatCurrency(kpis.totalOutstandingBalance)}
            icon={DollarSign}
            color="bg-red-500"
          />
          <KPICard
            label="Open Invoices"
            value={String(kpis.openInvoicesCount)}
            icon={FileText}
            color="bg-blue-500"
          />
          <KPICard
            label="MRR"
            value={formatCurrency(kpis.monthlyRecurringRevenue)}
            icon={TrendingUp}
            color="bg-emerald-500"
            subtitle="Monthly Recurring Revenue"
          />
          <KPICard
            label="Active Agreements"
            value={String(kpis.activeAgreementsCount)}
            icon={Handshake}
            color="bg-cyan-500"
          />
          <KPICard
            label="Open POs"
            value={String(kpis.openPOsCount)}
            icon={ShoppingCart}
            color="bg-orange-500"
          />
          <KPICard
            label="Budget Utilization"
            value={`${kpis.projectBudgetUtilization}%`}
            icon={PieChart}
            color={kpis.projectBudgetUtilization > 100 ? 'bg-red-500' : 'bg-yellow-500'}
            subtitle="Project hours used"
          />
        </div>

        {/* CHARTS — two column on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <RevenueChart data={revenueByMonth} />
          <AgingChart data={agingBuckets} />
        </div>

        {/* RECENT INVOICES */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Recent Invoices
          </h2>
          <InvoicesTable invoices={recentInvoices} />
        </div>

        {/* AGREEMENTS + PURCHASE ORDERS — two column on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Active Agreements ({activeAgreements.length})
            </h2>
            <AgreementsGrid agreements={activeAgreements} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Open Purchase Orders ({openPurchaseOrders.length})
            </h2>
            <PurchaseOrdersList orders={openPurchaseOrders} />
          </div>
        </div>
      </div>
    </div>
  )
}
