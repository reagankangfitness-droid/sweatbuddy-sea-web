ALTER TABLE "communities"
  ADD COLUMN "usualArea" VARCHAR(160),
  ADD COLUMN "usualSchedule" VARCHAR(220),
  ADD COLUMN "joinPlatform" VARCHAR(40),
  ADD COLUMN "vibeTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "priceType" VARCHAR(40),
  ADD COLUMN "beginnerFriendly" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sourceUrl" VARCHAR(500),
  ADD COLUMN "lastVerifiedAt" TIMESTAMP(3);

CREATE INDEX "communities_joinPlatform_idx" ON "communities"("joinPlatform");
CREATE INDEX "communities_priceType_idx" ON "communities"("priceType");
CREATE INDEX "communities_beginnerFriendly_idx" ON "communities"("beginnerFriendly");
