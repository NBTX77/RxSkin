'use client'

import { useQuery } from '@tanstack/react-query'

// ── Types matching BFF response ──────────────────────────────

export interface FinancialKPIs {
  totalOutstandingBalance: number
  openInvoicesCount: number
  monthlyRecurringRevenue: number
  activeAgreementsCount: number
  openPOsCount: number
  projectBudgetUtilization: number
}

export interface RevenueMonth {
  month: string
  year: number
  revenue: number
}

export interface AgingBucket {
  label: string
  range: string
  count: number
  total: number
  color: string
}

export interface InvoiceSummary {
  id: number
  invoiceNumber: string
  companyName: string
  total: number
  balance: number
  dueDate: string
  status: string
  isOverdue: boolean
}

export interface AgreementSummary {
  id: number
  name: string
  companyName: string
  typeName: string
  billAmount: number
  periodType: string
  startDate: string
  endDate: string
  noEndingDate: boolean
}

export interface PurchaseOrderSummary {
  id: number
  poNumber: string
  vendorName: string
  total: number
  status: string
  closedFlag: boolean
}

export interface FinancialsData {
  kpis: FinancialKPIs
  recentInvoices: InvoiceSummary[]
  activeAgreements: AgreementSummary[]
  openPurchaseOrders: PurchaseOrderSummary[]
  revenueByMonth: RevenueMonth[]
  agingBuckets: AgingBucket[]
  errors: string[]
}

// ── Hook ─────────────────────────────────────────────────────

export function useFinancialsData() {
  return useQuery<FinancialsData>({
    queryKey: ['financials'],
    queryFn: async () => {
      const res = await fetch('/api/financials')
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const message = body?.message ?? 'Failed to fetch financial data'
        throw new Error(message)
      }
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
  })
}
