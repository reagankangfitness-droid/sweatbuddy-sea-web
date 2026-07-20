ALTER TABLE "fitness_places"
  ADD COLUMN "googleRating" DECIMAL(3,2),
  ADD COLUMN "googleReviewCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "googleMapsUrl" VARCHAR(500),
  ADD COLUMN "openingHours" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "placeTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "trustScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "photoQualityScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "reviewSentimentScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "aiSummary" TEXT,
  ADD COLUMN "aiPros" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "aiCons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "intelligenceStatus" VARCHAR(40),
  ADD COLUMN "rawGoogleData" JSONB,
  ADD COLUMN "lastEnrichedAt" TIMESTAMP(3);

CREATE INDEX "fitness_places_trustScore_idx" ON "fitness_places"("trustScore");
CREATE INDEX "fitness_places_lastEnrichedAt_idx" ON "fitness_places"("lastEnrichedAt");
