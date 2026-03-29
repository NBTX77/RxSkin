export type FeedbackRating = 'positive' | 'negative'
export type FeedbackCategory = 'bug' | 'feature_request' | 'ux_issue' | 'performance' | 'other'
export type FeedbackAdminStatus = 'unreviewed' | 'reviewed' | 'to_implement' | 'wont_fix' | 'duplicate' | 'implemented'

export interface FeedbackSubmission {
  rating: FeedbackRating
  category: FeedbackCategory
  comment?: string
  screenshotUrl?: string
  page: string
  component?: string
  featureLabel?: string
  viewport?: string
  department?: string
  sessionId: string
  userAgent?: string
}

export interface UserFeedback extends FeedbackSubmission {
  id: string
  tenantId: string
  userId?: string
  adminStatus: FeedbackAdminStatus
  adminNotes?: string
  reviewedBy?: string
  reviewedAt?: string
  linkedTaskUrl?: string
  createdAt: string
  updatedAt: string
}
