-- CreateTable
CREATE TABLE "survey_responses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ticketId" INTEGER,
    "ticketTitle" TEXT,
    "rating" TEXT,
    "score" INTEGER,
    "comment" TEXT,
    "company" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "agents" TEXT,
    "segment" TEXT,
    "permalink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SurveyResponse_tenantId_ticketId_idx" ON "survey_responses"("tenantId", "ticketId");

-- CreateIndex
CREATE INDEX "SurveyResponse_tenantId_company_idx" ON "survey_responses"("tenantId", "company");

-- CreateIndex
CREATE INDEX "SurveyResponse_tenantId_agents_idx" ON "survey_responses"("tenantId", "agents");

-- CreateIndex
CREATE INDEX "SurveyResponse_tenantId_createdAt_idx" ON "survey_responses"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
