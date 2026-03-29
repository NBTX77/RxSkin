-- CreateTable
CREATE TABLE "client_tenants" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "azureTenantId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "domain" TEXT,
    "cwCompanyId" INTEGER,
    "gdapRelationshipId" TEXT,
    "gdapStatus" TEXT NOT NULL DEFAULT 'pending',
    "gdapExpiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "client_tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m365_audit_actions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientTenantId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "m365_audit_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_tenants_tenantId_azureTenantId_key" ON "client_tenants"("tenantId", "azureTenantId");
CREATE INDEX "client_tenants_tenantId_idx" ON "client_tenants"("tenantId");
CREATE INDEX "m365_audit_actions_tenantId_clientTenantId_idx" ON "m365_audit_actions"("tenantId", "clientTenantId");
CREATE INDEX "m365_audit_actions_actorId_idx" ON "m365_audit_actions"("actorId");
CREATE INDEX "m365_audit_actions_createdAt_idx" ON "m365_audit_actions"("createdAt");

-- AddForeignKey
ALTER TABLE "client_tenants" ADD CONSTRAINT "client_tenants_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
