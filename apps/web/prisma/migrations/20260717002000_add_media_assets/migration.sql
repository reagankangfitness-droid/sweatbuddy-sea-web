DO $$ BEGIN
  CREATE TYPE "MediaAssetEntityType" AS ENUM ('ACTIVITY', 'FITNESS_PLACE', 'COMMUNITY', 'USER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MediaAssetSourceType" AS ENUM ('UPLOAD', 'GOOGLE_PLACE', 'WIKIMEDIA', 'PARTNER', 'REVIEW', 'WEBSITE', 'COMMUNITY', 'ACTIVITY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MediaAssetStatus" AS ENUM ('LIVE', 'NEEDS_REVIEW', 'REJECTED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "media_assets" (
  "id" TEXT NOT NULL,
  "entityType" "MediaAssetEntityType" NOT NULL,
  "entityId" VARCHAR(120) NOT NULL,
  "sourceType" "MediaAssetSourceType" NOT NULL,
  "imageUrl" VARCHAR(1000) NOT NULL,
  "thumbnailUrl" VARCHAR(1000),
  "sourceUrl" VARCHAR(1000),
  "externalId" VARCHAR(300),
  "attributionName" VARCHAR(200),
  "attributionUrl" VARCHAR(1000),
  "license" VARCHAR(120),
  "width" INTEGER,
  "height" INTEGER,
  "dominantColor" VARCHAR(20),
  "priority" INTEGER NOT NULL DEFAULT 0,
  "status" "MediaAssetStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
  "capturedAt" TIMESTAMP(3),
  "lastFetchedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "media_assets_entityType_entityId_status_idx" ON "media_assets"("entityType", "entityId", "status");
CREATE INDEX IF NOT EXISTS "media_assets_sourceType_externalId_idx" ON "media_assets"("sourceType", "externalId");
CREATE INDEX IF NOT EXISTS "media_assets_status_priority_idx" ON "media_assets"("status", "priority");
CREATE INDEX IF NOT EXISTS "media_assets_expiresAt_idx" ON "media_assets"("expiresAt");
