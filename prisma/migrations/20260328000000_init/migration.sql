-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TECHNICIAN', 'VIEWER');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "cwBaseUrl" TEXT NOT NULL,
    "cwCompanyId" TEXT NOT NULL,
    "cwClientId" TEXT NOT NULL,
    "cwPublicKey" TEXT NOT NULL,
    "cwPrivateKey" TEXT NOT NULL,
    "azureClientId" TEXT,
    "azureClientSecret" TEXT,
    "azureTenantId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TECHNICIAN',
    "cwMemberId" TEXT,
    "passwordHash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_credentials" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "label" TEXT,
    "credentials" JSONB NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "testedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_oauth_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_oauth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_cache" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cwTicketId" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "board" TEXT,
    "companyId" INTEGER,
    "companyName" TEXT,
    "contactId" INTEGER,
    "contactName" TEXT,
    "assignedTo" TEXT,
    "assignedToId" TEXT,
    "budgetHours" DOUBLE PRECISION,
    "actualHours" DOUBLE PRECISION,
    "cwCreatedAt" TIMESTAMP(3),
    "cwUpdatedAt" TIMESTAMP(3),
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultBoardId" INTEGER,
    "defaultView" TEXT NOT NULL DEFAULT 'week',
    "theme" TEXT NOT NULL DEFAULT 'system',
    "notificationPrefs" JSONB NOT NULL DEFAULT '{}',
    "uiPreferences" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "defaultTimezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "businessHours" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");
CREATE UNIQUE INDEX "tc_tenantId_platform_key" ON "tenant_credentials"("tenantId", "platform");
CREATE UNIQUE INDEX "uot_userId_provider_key" ON "user_oauth_tokens"("userId", "provider");
CREATE UNIQUE INDEX "tc_tenantId_cwTicketId_key" ON "ticket_cache"("tenantId", "cwTicketId");
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");
CREATE UNIQUE INDEX "tenant_settings_tenantId_key" ON "tenant_settings"("tenantId");

-- CreateIndex (performance)
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");
CREATE INDEX "tc_tenantId_idx" ON "tenant_credentials"("tenantId");
CREATE INDEX "uot_userId_idx" ON "user_oauth_tokens"("userId");
CREATE INDEX "ticket_cache_tenantId_idx" ON "ticket_cache"("tenantId");
CREATE INDEX "ticket_cache_tenantId_status_idx" ON "ticket_cache"("tenantId", "status");
CREATE INDEX "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");
CREATE INDEX "audit_logs_res_idx" ON "audit_logs"("tenantId", "resourceType", "resourceId");
CREATE INDEX "audit_logs_user_idx" ON "audit_logs"("tenantId", "userId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tenant_credentials" ADD CONSTRAINT "tc_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_oauth_tokens" ADD CONSTRAINT "uot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "al_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "al_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_settings" ADD CONSTRAINT "us_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tenant_settings" ADD CONSTRAINT "ts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
