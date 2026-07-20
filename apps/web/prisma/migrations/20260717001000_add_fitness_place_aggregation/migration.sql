-- CreateEnum
CREATE TYPE "FitnessPlaceSourceType" AS ENUM ('OSM', 'GOOGLE_PLACES', 'WEBSITE', 'COMMUNITY', 'EVENT', 'USER_SUBMISSION', 'MANUAL');

-- CreateEnum
CREATE TYPE "FitnessPlaceImportStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DiscoveredFitnessPlaceStatus" AS ENUM ('DISCOVERED', 'AUTO_PUBLISHED', 'NEEDS_REVIEW', 'MERGED', 'REJECTED', 'ERROR');

-- AlterTable
ALTER TABLE "fitness_places"
  ADD COLUMN "osmElementId" TEXT,
  ADD COLUMN "sourceProvider" VARCHAR(40),
  ADD COLUMN "sourceExternalId" VARCHAR(160);

-- CreateTable
CREATE TABLE "fitness_place_import_runs" (
  "id" TEXT NOT NULL,
  "sourceType" "FitnessPlaceSourceType" NOT NULL,
  "city" VARCHAR(120) NOT NULL,
  "query" TEXT,
  "status" "FitnessPlaceImportStatus" NOT NULL DEFAULT 'RUNNING',
  "candidatesFound" INTEGER NOT NULL DEFAULT 0,
  "candidatesCreated" INTEGER NOT NULL DEFAULT 0,
  "candidatesUpdated" INTEGER NOT NULL DEFAULT 0,
  "publishedCount" INTEGER NOT NULL DEFAULT 0,
  "skippedCount" INTEGER NOT NULL DEFAULT 0,
  "errorCount" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "fitness_place_import_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovered_fitness_places" (
  "id" TEXT NOT NULL,
  "importRunId" TEXT,
  "sourceType" "FitnessPlaceSourceType" NOT NULL,
  "sourceId" VARCHAR(180) NOT NULL,
  "sourceUrl" VARCHAR(500),
  "name" TEXT NOT NULL,
  "normalizedName" VARCHAR(220) NOT NULL,
  "placeType" "FitnessPlaceType" NOT NULL,
  "city" VARCHAR(120) NOT NULL,
  "area" VARCHAR(160),
  "address" VARCHAR(500),
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "websiteUrl" VARCHAR(500),
  "phone" VARCHAR(80),
  "activities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "amenities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "vibeTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "communityTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "bestFor" VARCHAR(240),
  "priceSummary" VARCHAR(180),
  "trialSummary" VARCHAR(180),
  "dropInFriendly" BOOLEAN NOT NULL DEFAULT false,
  "beginnerFriendly" BOOLEAN NOT NULL DEFAULT false,
  "socialScore" INTEGER NOT NULL DEFAULT 0,
  "confidenceScore" INTEGER NOT NULL DEFAULT 0,
  "status" "DiscoveredFitnessPlaceStatus" NOT NULL DEFAULT 'DISCOVERED',
  "matchedPlaceId" TEXT,
  "publishedPlaceId" TEXT,
  "rawData" JSONB,
  "sourceTags" JSONB,
  "errorMessage" TEXT,
  "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "discovered_fitness_places_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fitness_places_osmElementId_key" ON "fitness_places"("osmElementId");
CREATE INDEX "fitness_places_sourceProvider_sourceExternalId_idx" ON "fitness_places"("sourceProvider", "sourceExternalId");
CREATE INDEX "fitness_place_import_runs_sourceType_city_startedAt_idx" ON "fitness_place_import_runs"("sourceType", "city", "startedAt");
CREATE INDEX "fitness_place_import_runs_status_idx" ON "fitness_place_import_runs"("status");
CREATE UNIQUE INDEX "discovered_fitness_places_sourceType_sourceId_key" ON "discovered_fitness_places"("sourceType", "sourceId");
CREATE INDEX "discovered_fitness_places_importRunId_idx" ON "discovered_fitness_places"("importRunId");
CREATE INDEX "discovered_fitness_places_status_idx" ON "discovered_fitness_places"("status");
CREATE INDEX "discovered_fitness_places_city_placeType_idx" ON "discovered_fitness_places"("city", "placeType");
CREATE INDEX "discovered_fitness_places_confidenceScore_idx" ON "discovered_fitness_places"("confidenceScore");
CREATE INDEX "discovered_fitness_places_matchedPlaceId_idx" ON "discovered_fitness_places"("matchedPlaceId");
CREATE INDEX "discovered_fitness_places_publishedPlaceId_idx" ON "discovered_fitness_places"("publishedPlaceId");

-- AddForeignKey
ALTER TABLE "discovered_fitness_places" ADD CONSTRAINT "discovered_fitness_places_importRunId_fkey" FOREIGN KEY ("importRunId") REFERENCES "fitness_place_import_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "discovered_fitness_places" ADD CONSTRAINT "discovered_fitness_places_matchedPlaceId_fkey" FOREIGN KEY ("matchedPlaceId") REFERENCES "fitness_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "discovered_fitness_places" ADD CONSTRAINT "discovered_fitness_places_publishedPlaceId_fkey" FOREIGN KEY ("publishedPlaceId") REFERENCES "fitness_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
