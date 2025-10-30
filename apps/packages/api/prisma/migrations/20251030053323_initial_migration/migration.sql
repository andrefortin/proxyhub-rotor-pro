-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('api', 'file', 'manual');

-- CreateEnum
CREATE TYPE "LeaseStatus" AS ENUM ('active', 'ok', 'failed', 'expired');

-- CreateEnum
CREATE TYPE "UsageOutcome" AS ENUM ('success', 'failure');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('pending', 'running', 'done', 'failed');

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProviderType" NOT NULL,
    "config" JSONB NOT NULL,
    "logoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proxy" (
    "id" TEXT NOT NULL,
    "providerId" TEXT,
    "pool" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "protocol" TEXT NOT NULL DEFAULT 'http',
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "asn" INTEGER,
    "org" TEXT,
    "lastChecked" TIMESTAMP(3),
    "lastUsed" TIMESTAMP(3),
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "tags" TEXT[],
    "meta" JSONB,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proxy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolPolicy" (
    "id" TEXT NOT NULL,
    "pool" TEXT NOT NULL,
    "reuseTtlSeconds" INTEGER NOT NULL DEFAULT 86400,
    "maxFailures" INTEGER NOT NULL DEFAULT 5,
    "allowFreeProxies" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoolPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lease" (
    "id" TEXT NOT NULL,
    "proxyId" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "apiKeyId" TEXT,
    "sticky" BOOLEAN NOT NULL DEFAULT false,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "status" "LeaseStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "Lease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "project" TEXT NOT NULL,
    "pool" TEXT NOT NULL,
    "apiKeyId" TEXT,
    "proxyId" TEXT,
    "outcome" "UsageOutcome" NOT NULL,
    "latencyMs" INTEGER,
    "status" INTEGER,
    "error" TEXT,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageDaily" (
    "id" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "project" TEXT NOT NULL,
    "pool" TEXT NOT NULL,
    "apiKeyId" TEXT,
    "success" INTEGER NOT NULL DEFAULT 0,
    "failure" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UsageDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderImport" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "importType" "ProviderType" NOT NULL,
    "sourceUri" TEXT,
    "rowsAdded" INTEGER NOT NULL DEFAULT 0,
    "rowsTotal" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "ImportStatus" NOT NULL DEFAULT 'pending',
    "meta" JSONB,

    CONSTRAINT "ProviderImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationConfig" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "eventTypes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Provider_name_key" ON "Provider"("name");

-- CreateIndex
CREATE INDEX "Proxy_pool_idx" ON "Proxy"("pool");

-- CreateIndex
CREATE INDEX "Proxy_providerId_idx" ON "Proxy"("providerId");

-- CreateIndex
CREATE INDEX "Proxy_score_idx" ON "Proxy"("score");

-- CreateIndex
CREATE UNIQUE INDEX "PoolPolicy_pool_key" ON "PoolPolicy"("pool");

-- CreateIndex
CREATE UNIQUE INDEX "UsageDaily_day_project_pool_apiKeyId_key" ON "UsageDaily"("day", "project", "pool", "apiKeyId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_secret_key" ON "ApiKey"("secret");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationConfig_method_key" ON "NotificationConfig"("method");

-- AddForeignKey
ALTER TABLE "Proxy" ADD CONSTRAINT "Proxy_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_proxyId_fkey" FOREIGN KEY ("proxyId") REFERENCES "Proxy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderImport" ADD CONSTRAINT "ProviderImport_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
