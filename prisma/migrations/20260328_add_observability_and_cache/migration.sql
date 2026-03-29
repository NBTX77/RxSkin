-- Migration: add_observability_and_cache
-- Adds API call logging, analytics events, UI component registry, entity cache tables, and sync state

-- API Call Logs
CREATE TABLE "api_call_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "statusCode" INTEGER,
    "responseTimeMs" INTEGER,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "requestPayloadSize" INTEGER,
    "responsePayloadSize" INTEGER,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_call_logs_pkey" PRIMARY KEY ("id")
);

-- Analytics Events
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "page" TEXT,
    "component" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "department" TEXT,
    "viewport" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- UI Component Registry
CREATE TABLE "ui_components" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "componentName" TEXT NOT NULL,
    "pagePath" TEXT NOT NULL,
    "renderCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "avgRenderTimeMs" DOUBLE PRECISION,
    "lastRenderAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "lastErrorMessage" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ui_components_pkey" PRIMARY KEY ("id")
);

-- Project Cache
CREATE TABLE "project_cache" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cwProjectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT,
    "statusId" INTEGER,
    "department" TEXT,
    "manager" TEXT,
    "managerId" INTEGER,
    "company" TEXT,
    "companyId" INTEGER,
    "budgetHours" DOUBLE PRECISION,
    "actualHours" DOUBLE PRECISION,
    "scheduledHours" DOUBLE PRECISION,
    "billing" TEXT,
    "estimatedStart" TIMESTAMP(3),
    "estimatedEnd" TIMESTAMP(3),
    "cwUpdatedAt" TIMESTAMP(3),
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_cache_pkey" PRIMARY KEY ("id")
);

-- Company Cache
CREATE TABLE "company_cache" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cwCompanyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "identifier" TEXT,
    "type" TEXT,
    "status" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "city" TEXT,
    "state" TEXT,
    "cwUpdatedAt" TIMESTAMP(3),
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_cache_pkey" PRIMARY KEY ("id")
);

-- Cache Sync State
CREATE TABLE "cache_sync_state" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "syncDurationMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cache_sync_state_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "project_cache_tenantId_cwProjectId_key" ON "project_cache"("tenantId", "cwProjectId");
CREATE UNIQUE INDEX "company_cache_tenantId_cwCompanyId_key" ON "company_cache"("tenantId", "cwCompanyId");
CREATE UNIQUE INDEX "ui_components_tenantId_componentName_pagePath_key" ON "ui_components"("tenantId", "componentName", "pagePath");
CREATE UNIQUE INDEX "cache_sync_state_tenantId_entityType_key" ON "cache_sync_state"("tenantId", "entityType");

-- Performance indexes
CREATE INDEX "api_call_logs_tenantId_idx" ON "api_call_logs"("tenantId");
CREATE INDEX "api_call_logs_tenantId_platform_idx" ON "api_call_logs"("tenantId", "platform");
CREATE INDEX "api_call_logs_tenantId_createdAt_idx" ON "api_call_logs"("tenantId", "createdAt");
CREATE INDEX "api_call_logs_cacheHit_idx" ON "api_call_logs"("cacheHit");
CREATE INDEX "analytics_events_tenantId_idx" ON "analytics_events"("tenantId");
CREATE INDEX "analytics_events_tenantId_eventType_idx" ON "analytics_events"("tenantId", "eventType");
CREATE INDEX "analytics_events_tenantId_createdAt_idx" ON "analytics_events"("tenantId", "createdAt");
CREATE INDEX "analytics_events_sessionId_idx" ON "analytics_events"("sessionId");
CREATE INDEX "analytics_events_component_idx" ON "analytics_events"("component");
CREATE INDEX "project_cache_tenantId_idx" ON "project_cache"("tenantId");
CREATE INDEX "project_cache_tenantId_department_idx" ON "project_cache"("tenantId", "department");
CREATE INDEX "company_cache_tenantId_idx" ON "company_cache"("tenantId");
CREATE INDEX "ui_components_tenantId_idx" ON "ui_components"("tenantId");

-- Foreign keys (only on cache tables, not high-volume log tables)
ALTER TABLE "project_cache" ADD CONSTRAINT "project_cache_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "company_cache" ADD CONSTRAINT "company_cache_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cache_sync_state" ADD CONSTRAINT "cache_sync_state_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
