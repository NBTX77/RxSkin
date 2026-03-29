-- Add feedbackEnabled to tenant_settings
ALTER TABLE "tenant_settings" ADD COLUMN "feedbackEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable: user_feedback
CREATE TABLE "user_feedback" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "comment" TEXT,
    "screenshotUrl" TEXT,
    "page" TEXT NOT NULL,
    "component" TEXT,
    "featureLabel" TEXT,
    "viewport" TEXT,
    "department" TEXT,
    "userAgent" TEXT,
    "adminStatus" TEXT NOT NULL DEFAULT 'unreviewed',
    "adminNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "linkedTaskUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_feedback_tenantId_idx" ON "user_feedback"("tenantId");
CREATE INDEX "user_feedback_tenantId_adminStatus_idx" ON "user_feedback"("tenantId", "adminStatus");
CREATE INDEX "user_feedback_tenantId_category_idx" ON "user_feedback"("tenantId", "category");
CREATE INDEX "user_feedback_tenantId_page_idx" ON "user_feedback"("tenantId", "page");
CREATE INDEX "user_feedback_tenantId_createdAt_idx" ON "user_feedback"("tenantId", "createdAt");
