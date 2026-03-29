// ============================================================
// ScalePad API Response Normalizers — RX Skin BFF
// Transforms raw ScalePad API responses into typed CBR models.
// ============================================================

import type {
  CBRClient,
  CBRHardwareAsset,
  CBRHardwareLifecycle,
  CBRSaaSAsset,
  CBROpportunity,
  CBRContract,
  CBRInitiative,
  CBRBudgetItem,
  CBRActionItem,
} from '@/types/cbr'

// ── Helpers ────────────────────────────────────────────────────

/** Safely read a string from a raw object. */
function str(raw: Record<string, unknown>, key: string, fallback = ''): string {
  const v = raw[key]
  return typeof v === 'string' ? v : fallback
}

/** Safely read a number from a raw object. */
function num(raw: Record<string, unknown>, key: string, fallback = 0): number {
  const v = raw[key]
  return typeof v === 'number' ? v : fallback
}

/** Safely read a boolean from a raw object. */
function bool(raw: Record<string, unknown>, key: string, fallback = false): boolean {
  const v = raw[key]
  return typeof v === 'boolean' ? v : fallback
}

/** Safely read a sub-object from a raw object. */
function obj(raw: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const v = raw[key]
  return (v && typeof v === 'object' && !Array.isArray(v)) ? v as Record<string, unknown> : undefined
}

// ── Client ─────────────────────────────────────────────────────

/**
 * Normalize a raw ScalePad client record into CBRClient.
 * Extracts cwCompanyId from record_lineage where vendor.brand_name === 'ConnectWise Manage'.
 */
export function normalizeClient(raw: Record<string, unknown>): CBRClient {
  let cwCompanyId: number | undefined

  const lineage = raw.record_lineage
  if (Array.isArray(lineage)) {
    for (const entry of lineage) {
      if (entry && typeof entry === 'object') {
        const rec = entry as Record<string, unknown>
        const vendor = obj(rec, 'vendor')
        if (vendor && str(vendor, 'brand_name') === 'ConnectWise Manage') {
          const extId = rec.external_id
          if (typeof extId === 'string') {
            const parsed = parseInt(extId, 10)
            if (!isNaN(parsed)) cwCompanyId = parsed
          } else if (typeof extId === 'number') {
            cwCompanyId = extId
          }
          break
        }
      }
    }
  }

  return {
    id: str(raw, 'id'),
    name: str(raw, 'name'),
    lifecycle: str(raw, 'lifecycle', 'unknown'),
    domain: str(raw, 'domain') || undefined,
    contactCount: num(raw, 'contact_count'),
    hardwareAssetCount: num(raw, 'hardware_asset_count'),
    cwCompanyId,
    updatedAt: str(raw, 'updated_at'),
  }
}

// ── Hardware Assets ────────────────────────────────────────────

export function normalizeHardwareAsset(raw: Record<string, unknown>): CBRHardwareAsset {
  const client = obj(raw, 'client')
  const typeRaw = str(raw, 'type')

  return {
    id: str(raw, 'id'),
    name: str(raw, 'name'),
    clientId: client ? str(client, 'id') || undefined : undefined,
    clientName: client ? str(client, 'name') || undefined : undefined,
    manufacturer: str(raw, 'manufacturer') || undefined,
    model: str(raw, 'model') || undefined,
    modelDescription: str(raw, 'model_description') || undefined,
    serialNumber: str(raw, 'serial_number') || undefined,
    type: typeRaw ? typeRaw.trim() : undefined,  // ScalePad pads type with spaces
    os: str(raw, 'os') || undefined,
    cpu: str(raw, 'cpu') || undefined,
    ramGB: raw.ram_gb != null ? num(raw, 'ram_gb') : undefined,
    avStatus: str(raw, 'av_status') || undefined,
    lastLoginUser: str(raw, 'last_login_user') || undefined,
    locationName: str(raw, 'location_name') || undefined,
  }
}

// ── Hardware Lifecycles ────────────────────────────────────────

export function normalizeHardwareLifecycle(raw: Record<string, unknown>): CBRHardwareLifecycle {
  const warrantyExpiry = str(raw, 'warranty_expiry_date') || undefined
  let isWarrantyExpired: boolean | null = null
  let warrantyDaysRemaining: number | null = null

  if (warrantyExpiry) {
    const expiryDate = new Date(warrantyExpiry)
    const now = new Date()
    if (!isNaN(expiryDate.getTime())) {
      isWarrantyExpired = expiryDate < now
      warrantyDaysRemaining = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
    }
  }

  return {
    clientId: str(raw, 'client_id') || undefined,
    serialNumber: str(raw, 'serial_number') || undefined,
    manufacturer: str(raw, 'manufacturer') || undefined,
    model: str(raw, 'model') || undefined,
    name: str(raw, 'name') || undefined,
    purchaseDate: str(raw, 'purchase_date') || undefined,
    warrantyExpiryDate: warrantyExpiry,
    warrantySource: str(raw, 'warranty_source') || undefined,
    isWarrantyExpired,
    warrantyDaysRemaining,
  }
}

// ── SaaS Assets ────────────────────────────────────────────────

export function normalizeSaaSAsset(raw: Record<string, unknown>): CBRSaaSAsset {
  const client = obj(raw, 'client')
  const capacity = num(raw, 'seat_capacity')
  const utilized = num(raw, 'seat_utilized')
  const waste = Math.max(0, capacity - utilized)
  const wastePercent = capacity > 0 ? Math.round((waste / capacity) * 100) : 0

  return {
    id: str(raw, 'id'),
    clientId: client ? str(client, 'id') || undefined : undefined,
    clientName: client ? str(client, 'name') || undefined : undefined,
    productName: str(raw, 'product_name') || undefined,
    manufacturer: str(raw, 'manufacturer') || undefined,
    status: str(raw, 'status') || undefined,
    seatCapacity: capacity,
    seatUtilized: utilized,
    seatWaste: waste,
    wastePercent,
  }
}

// ── Opportunities ──────────────────────────────────────────────

export function normalizeOpportunity(raw: Record<string, unknown>): CBROpportunity {
  const client = obj(raw, 'client')

  return {
    id: str(raw, 'id'),
    title: str(raw, 'title'),
    description: str(raw, 'description') || undefined,
    status: str(raw, 'status') || undefined,
    stage: str(raw, 'stage') || undefined,
    isActive: bool(raw, 'is_active'),
    probability: raw.probability != null ? num(raw, 'probability') : undefined,
    clientId: client ? str(client, 'id') || undefined : undefined,
    clientName: client ? str(client, 'name') || undefined : undefined,
  }
}

// ── Contracts ──────────────────────────────────────────────────

export function normalizeContract(raw: Record<string, unknown>): CBRContract {
  const client = obj(raw, 'client')

  return {
    id: str(raw, 'id'),
    name: str(raw, 'name'),
    clientId: client ? str(client, 'id') || undefined : undefined,
    clientName: client ? str(client, 'name') || undefined : undefined,
    isRecurring: bool(raw, 'is_recurring'),
    billingPeriod: str(raw, 'billing_period') || undefined,
    startsAt: str(raw, 'starts_at') || undefined,
    endsAt: str(raw, 'ends_at') || undefined,
    autoRenew: bool(raw, 'auto_renew'),
    status: str(raw, 'status') || undefined,
  }
}

// ── Initiatives ────────────────────────────────────────────────

export function normalizeInitiative(raw: Record<string, unknown>): CBRInitiative {
  const client = obj(raw, 'client')
  const lineItems = raw.line_items

  const budgetItems: CBRBudgetItem[] = []
  let totalBudgetCents = 0

  if (Array.isArray(lineItems)) {
    for (const item of lineItems) {
      if (item && typeof item === 'object') {
        const li = item as Record<string, unknown>
        const costCents = num(li, 'cost_subunits')
        budgetItems.push({
          label: str(li, 'label'),
          costCents,
          costType: str(li, 'cost_type') || undefined,
        })
        totalBudgetCents += costCents
      }
    }
  }

  return {
    id: str(raw, 'id'),
    clientId: client ? str(client, 'id') || undefined : undefined,
    clientName: client ? str(client, 'name') || undefined : undefined,
    name: str(raw, 'name'),
    executiveSummary: str(raw, 'executive_summary') || undefined,
    fiscalQuarter: str(raw, 'fiscal_quarter') || undefined,
    priority: str(raw, 'priority') || undefined,
    status: str(raw, 'status') || undefined,
    assetCount: num(raw, 'asset_count'),
    budgetItems,
    totalBudgetCents,
  }
}

// ── Action Items ───────────────────────────────────────────────

export function normalizeActionItem(raw: Record<string, unknown>): CBRActionItem {
  return {
    id: str(raw, 'id'),
    clientId: str(raw, 'client_id') || undefined,
    title: str(raw, 'title'),
    description: str(raw, 'description') || undefined,
    status: str(raw, 'status') || undefined,
    priority: str(raw, 'priority') || undefined,
    dueDate: str(raw, 'due_date') || undefined,
    assignedTo: str(raw, 'assigned_to') || undefined,
  }
}
