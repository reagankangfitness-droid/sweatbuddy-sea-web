CREATE TYPE "DiscoverySourceType" AS ENUM ('WEBSITE', 'EVENTBRITE', 'PEATIX', 'MEETUP', 'INSTAGRAM', 'LINKTREE', 'CALENDAR', 'OTHER');

CREATE TYPE "DiscoverySourceStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ERROR');

CREATE TYPE "DiscoveredSessionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DUPLICATE', 'ARCHIVED');

CREATE TABLE "discovery_sources" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "url" VARCHAR(700) NOT NULL,
    "sourceType" "DiscoverySourceType" NOT NULL DEFAULT 'WEBSITE',
    "status" "DiscoverySourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "city" VARCHAR(100) NOT NULL DEFAULT 'Singapore',
    "category" VARCHAR(80),
    "notes" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovery_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "discovered_sessions" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" VARCHAR(220) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(80),
    "city" VARCHAR(100) NOT NULL DEFAULT 'Singapore',
    "location" VARCHAR(500),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'Asia/Singapore',
    "price" INTEGER,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'SGD',
    "signupUrl" VARCHAR(700),
    "sourceUrl" VARCHAR(700) NOT NULL,
    "imageUrl" VARCHAR(700),
    "hostName" VARCHAR(200),
    "communityName" VARCHAR(200),
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "status" "DiscoveredSessionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "rawData" JSONB,
    "createdActivityId" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovered_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "discovery_sources_url_key" ON "discovery_sources"("url");
CREATE INDEX "discovery_sources_status_idx" ON "discovery_sources"("status");
CREATE INDEX "discovery_sources_city_idx" ON "discovery_sources"("city");
CREATE INDEX "discovery_sources_category_idx" ON "discovery_sources"("category");
CREATE INDEX "discovery_sources_lastCheckedAt_idx" ON "discovery_sources"("lastCheckedAt");

CREATE UNIQUE INDEX "discovered_sessions_createdActivityId_key" ON "discovered_sessions"("createdActivityId");
CREATE UNIQUE INDEX "discovered_sessions_sourceId_sourceUrl_key" ON "discovered_sessions"("sourceId", "sourceUrl");
CREATE INDEX "discovered_sessions_status_idx" ON "discovered_sessions"("status");
CREATE INDEX "discovered_sessions_city_idx" ON "discovered_sessions"("city");
CREATE INDEX "discovered_sessions_category_idx" ON "discovered_sessions"("category");
CREATE INDEX "discovered_sessions_startTime_idx" ON "discovered_sessions"("startTime");
CREATE INDEX "discovered_sessions_confidence_idx" ON "discovered_sessions"("confidence");

ALTER TABLE "discovered_sessions" ADD CONSTRAINT "discovered_sessions_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "discovery_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "discovered_sessions" ADD CONSTRAINT "discovered_sessions_createdActivityId_fkey" FOREIGN KEY ("createdActivityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
