// ============================================================
// CBR (Client Business Review) Types — ScalePad Integration
// Used by the CBR Dashboard for client health scoring,
// hardware lifecycle, SaaS optimization, and contract tracking.
// ============================================================

export interface CBRClient {
  id: string          // ScalePad UUID
  name: string
  lifecycle: string
  domain?: string
  contactCount: number
  hardwareAssetCount: number
  cwCompanyId?: number  // from record_lineage
  updatedAt: string
}

export interface CBRHardwareAsset {
  id: string
  name: string
  clientId?: string
  clientName?: string
  manufacturer?: string
  model?: string
  modelDescription?: string
  serialNumber?: string
  type?: string        // Workstation, Server, Network, etc.
  os?: string
  cpu?: string
  ramGB?: number
  avStatus?: string
  lastLoginUser?: string
  locationName?: string
}

export interface CBRHardwareLifecycle {
  clientId?: string
  serialNumber?: string
  manufacturer?: string
  model?: string
  name?: string
  purchaseDate?: string
  warrantyExpiryDate?: string
  warrantySource?: string
  isWarrantyExpired: boolean | null
  warrantyDaysRemaining: number | null
}

export interface CBRSaaSAsset {
  id: string
  clientId?: string
  clientName?: string
  productName?: string
  manufacturer?: string
  status?: string
  seatCapacity: number
  seatUtilized: number
  seatWaste: number
  wastePercent: number
}

export interface CBROpportunity {
  id: string
  title: string
  description?: string
  status?: string
  stage?: string
  isActive: boolean
  probability?: number
  clientId?: string
  clientName?: string
}

export interface CBRContract {
  id: string
  name: string
  clientId?: string
  clientName?: string
  isRecurring: boolean
  billingPeriod?: string
  startsAt?: string
  endsAt?: string
  autoRenew: boolean
  status?: string
}

export interface CBRInitiative {
  id: string
  clientId?: string
  clientName?: string
  name: string
  executiveSummary?: string
  fiscalQuarter?: string
  priority?: string
  status?: string
  assetCount: number
  budgetItems: CBRBudgetItem[]
  totalBudgetCents: number
}

export interface CBRBudgetItem {
  label: string
  costCents: number
  costType?: string
}

export interface ClientHealthScore {
  overall: number
  hardware: number
  software: number
  contracts: number
  opportunities: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  color: 'green' | 'yellow' | 'orange' | 'red'
  factors: HealthFactor[]
}

export interface HealthFactor {
  category: string
  label: string
  score: number
  weight: number
  detail: string
  actionable: boolean
  recommendation?: string
}

export interface CBRClientOverview {
  client: CBRClient
  healthScore: ClientHealthScore
  hardwareCount: number
  expiredWarrantyCount: number
  licensesCount: number
  licenseWastePercent: number
  openOpportunities: number
  activeContracts: number
  initiativesCount: number
}

export interface CBRActionItem {
  id: string
  clientId?: string
  title: string
  description?: string
  status?: string
  priority?: string
  dueDate?: string
  assignedTo?: string
}
