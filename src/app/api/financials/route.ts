// ============================================================
// GET /api/financials — Aggregated financial data
// Fetches invoices, agreements, POs, and projects in parallel.
// ============================================================

import { auth } from '@/lib/auth/config'
import { getTenantCredentials } from '@/lib/auth/credentials'
import { getInvoices, getAgreements, getPurchaseOrders, getProjects } from '@/lib/cw/client'
import type { CWInvoice, CWAgreement, CWPurchaseOrder } from '@/lib/cw/client'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import type { Project } from '@/types'

export const dynamic = 'force-dynamic'

// ── Response types ───────────────────────────────────────────

interface FinancialKPIs {
  totalOutstandingBalance: number
  openInvoicesCount: number
  monthlyRecurringRevenue: number
  activeAgreementsCount: number
  openPOsCount: number
  projectBudgetUtilization: number
}

interface RevenueMonth {
  month: string // "Jan", "Feb", etc.
  year: number
  revenue: number
}

interface AgingBucket {
  label: string
  range: string
  count: number
  total: number
  color: string
}

interface InvoiceSummary {
  id: number
  invoiceNumber: string
  companyName: string
  total: number
  balance: number
  dueDate: string
  status: string
  isOverdue: boolean
}

interface AgreementSummary {
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

interface PurchaseOrderSummary {
  id: number
  poNumber: string
  vendorName: string
  total: number
  status: string
  closedFlag: boolean
}

interface FinancialsResponse {
  kpis: FinancialKPIs
  recentInvoices: InvoiceSummary[]
  activeAgreements: AgreementSummary[]
  openPurchaseOrders: PurchaseOrderSummary[]
  revenueByMonth: RevenueMonth[]
  agingBuckets: AgingBucket[]
  errors: string[]
}

// ── Helpers ──────────────────────────────────────────────────

function getMonthLabel(monthIndex: number): string {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return labels[monthIndex] ?? 'Unknown'
}

function daysBetween(dateStr: string, now: Date): number {
  const d = new Date(dateStr)
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

function computeAgingBuckets(invoices: CWInvoice[], now: Date): AgingBucket[] {
  const buckets: AgingBucket[] = [
    { label: 'Current', range: '0-30 days', count: 0, total: 0, color: '#10b981' },
    { label: 'Past Due', range: '31-60 days', count: 0, total: 0, color: '#eab308' },
    { label: 'Overdue', range: '61-90 days', count: 0, total: 0, color: '#f97316' },
    { label: 'Critical', range: '90+ days', count: 0, total: 0, color: '#ef4444' },
  ]

  for (const inv of invoices) {
    if (inv.balance <= 0) continue
    const daysOld = daysBetween(inv.dueDate, now)
    let bucketIndex: number
    if (daysOld <= 30) bucketIndex = 0
    else if (daysOld <= 60) bucketIndex = 1
    else if (daysOld <= 90) bucketIndex = 2
    else bucketIndex = 3

    buckets[bucketIndex].count += 1
    buckets[bucketIndex].total += inv.balance
  }

  return buckets
}

function computeRevenueByMonth(invoices: CWInvoice[]): RevenueMonth[] {
  const now = new Date()
  const months: RevenueMonth[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      month: getMonthLabel(d.getMonth()),
      year: d.getFullYear(),
      revenue: 0,
    })
  }

  for (const inv of invoices) {
    if (!inv.date) continue
    const invDate = new Date(inv.date)
    const entry = months.find(
      (m) => m.month === getMonthLabel(invDate.getMonth()) && m.year === invDate.getFullYear()
    )
    if (entry) {
      entry.revenue += inv.total
    }
  }

  return months
}

function mapInvoiceSummary(inv: CWInvoice, now: Date): InvoiceSummary {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber ?? `INV-${inv.id}`,
    companyName: inv.company?.name ?? 'Unknown',
    total: inv.total ?? 0,
    balance: inv.balance ?? 0,
    dueDate: inv.dueDate ?? '',
    status: inv.status?.name ?? 'Unknown',
    isOverdue: inv.dueDate ? new Date(inv.dueDate) < now && (inv.balance ?? 0) > 0 : false,
  }
}

function mapAgreementSummary(agr: CWAgreement): AgreementSummary {
  return {
    id: agr.id,
    name: agr.name ?? 'Unnamed Agreement',
    companyName: agr.company?.name ?? 'Unknown',
    typeName: agr.type?.name ?? 'Unknown',
    billAmount: agr.billAmount ?? 0,
    periodType: agr.periodType ?? '',
    startDate: agr.startDate ?? '',
    endDate: agr.endDate ?? '',
    noEndingDate: agr.noEndingDateFlag ?? false,
  }
}

function mapPOSummary(po: CWPurchaseOrder): PurchaseOrderSummary {
  return {
    id: po.id,
    poNumber: po.poNumber ?? `PO-${po.id}`,
    vendorName: po.vendorCompany?.name ?? po.company?.name ?? 'Unknown Vendor',
    total: po.total ?? 0,
    status: po.status?.name ?? 'Unknown',
    closedFlag: po.closedFlag ?? false,
  }
}

// ── Route handler ────────────────────────────────────────────

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const isCWConfigured = !!(process.env.CW_BASE_URL && process.env.CW_PUBLIC_KEY && process.env.CW_PRIVATE_KEY)
    if (!isCWConfigured) {
      return Response.json(
        { code: 'SERVICE_UNAVAILABLE', message: 'ConnectWise API not configured', retryable: false },
        { status: 503 }
      )
    }

    const { tenantId } = session.user
    const creds = await getTenantCredentials(tenantId)

    // Fetch all four data sources in parallel with partial failure resilience
    const [invoicesResult, agreementsResult, posResult, projectsResult] = await Promise.allSettled([
      getInvoices(creds),
      getAgreements(creds),
      getPurchaseOrders(creds),
      getProjects(creds, { closedFlag: false }),
    ])

    const errors: string[] = []
    const invoices: CWInvoice[] = invoicesResult.status === 'fulfilled' ? invoicesResult.value : (errors.push('Invoices unavailable'), [])
    const agreements: CWAgreement[] = agreementsResult.status === 'fulfilled' ? agreementsResult.value : (errors.push('Agreements unavailable'), [])
    const purchaseOrders: CWPurchaseOrder[] = posResult.status === 'fulfilled' ? posResult.value : (errors.push('Purchase Orders unavailable'), [])
    const projects: Project[] = projectsResult.status === 'fulfilled' ? projectsResult.value : (errors.push('Projects unavailable'), [])

    // Check for 403 errors specifically
    for (const result of [invoicesResult, agreementsResult, posResult, projectsResult]) {
      if (result.status === 'rejected') {
        const err = result.reason
        if (err && typeof err === 'object' && 'status' in err && err.status === 403) {
          errors.push('Data unavailable - check API permissions')
        }
      }
    }

    const now = new Date()

    // KPIs
    const totalOutstandingBalance = invoices.reduce((sum, inv) => sum + (inv.balance ?? 0), 0)
    const openInvoicesCount = invoices.filter((inv) => !inv.closedFlag && (inv.balance ?? 0) > 0).length
    const activeAgreementsList = agreements.filter((a) => !a.cancelledFlag)
    const monthlyRecurringRevenue = activeAgreementsList.reduce((sum, a) => {
      const amount = a.billAmount ?? 0
      const period = (a.periodType ?? '').toLowerCase()
      if (period === 'monthly' || period === 'onetime') return sum + amount
      if (period === 'yearly' || period === 'annual') return sum + amount / 12
      if (period === 'quarterly') return sum + amount / 3
      return sum + amount
    }, 0)
    const activeAgreementsCount = activeAgreementsList.length
    const openPOs = purchaseOrders.filter((po) => !po.closedFlag)
    const openPOsCount = openPOs.length

    // Project budget utilization
    const totalBudget = projects.reduce((sum, p) => sum + (p.budgetHours ?? 0), 0)
    const totalActual = projects.reduce((sum, p) => sum + (p.actualHours ?? 0), 0)
    const projectBudgetUtilization = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0

    const kpis: FinancialKPIs = {
      totalOutstandingBalance,
      openInvoicesCount,
      monthlyRecurringRevenue,
      activeAgreementsCount,
      openPOsCount,
      projectBudgetUtilization,
    }

    // Recent invoices (top 20 by date)
    const recentInvoices = invoices
      .slice(0, 20)
      .map((inv) => mapInvoiceSummary(inv, now))

    // Active agreements (non-cancelled)
    const activeAgreementsSummary = activeAgreementsList.map(mapAgreementSummary)

    // Open POs
    const openPurchaseOrders = openPOs.map(mapPOSummary)

    // Revenue by month (last 6 months)
    const revenueByMonth = computeRevenueByMonth(invoices)

    // Aging buckets
    const agingBuckets = computeAgingBuckets(invoices, now)

    const response: FinancialsResponse = {
      kpis,
      recentInvoices,
      activeAgreements: activeAgreementsSummary,
      openPurchaseOrders,
      revenueByMonth,
      agingBuckets,
      errors,
    }

    return Response.json(response)
  } catch (error) {
    return handleApiError(error)
  }
}
