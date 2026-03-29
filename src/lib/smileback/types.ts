// ============================================================
// SmileBack CSAT/NPS Types — RX Skin
// Typed interfaces for SmileBack survey data used across
// ticket detail, tech scorecards, and exec dashboard.
// ============================================================

export interface SmileBackCSATReview {
  id: string
  rating: 'Positive' | 'Neutral' | 'Negative'
  comment: string | null
  company: string
  contact: string
  contactEmail: string
  ticketId: string
  ticketTitle: string
  ticketAgents: string  // comma-separated
  ticketSegment: string // board/department
  permalink: string
  hasMarketingPermission: boolean
  createdAt: string // ISO date
}

export interface SmileBackNPSResponse {
  id: string
  score: number  // 0-10
  comment: string | null
  company: string
  contact: string
  contactEmail: string
  campaign: string
  hasMarketingPermission: boolean
  createdAt: string
}

export interface SmileBackCSATSummary {
  totalReviews: number
  positive: number
  neutral: number
  negative: number
  csatPercent: number  // (positive / total) * 100
  withComments: number
}

export interface SmileBackNPSSummary {
  totalResponses: number
  promoters: number   // 9-10
  passives: number    // 7-8
  detractors: number  // 0-6
  npsScore: number    // promoters% - detractors%
}

export interface SmileBackTicketSurvey {
  ticketId: number
  rating: 'Positive' | 'Neutral' | 'Negative'
  comment: string | null
  contact: string
  createdAt: string
  permalink: string
}

export interface SmileBackTechScore {
  techName: string
  totalReviews: number
  positive: number
  neutral: number
  negative: number
  csatPercent: number
  recentTrend: 'up' | 'down' | 'stable'
}

export interface SmileBackCompanyScore {
  companyName: string
  csatPercent: number
  npsScore: number | null
  totalReviews: number
  lastReviewDate: string
  recentTrend: 'up' | 'down' | 'stable'
}
