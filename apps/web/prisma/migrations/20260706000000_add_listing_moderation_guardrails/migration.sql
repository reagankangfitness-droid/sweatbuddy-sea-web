-- Add risk-screening metadata for instant listings with moderation guardrails.
CREATE TYPE "ListingModerationStatus" AS ENUM ('LIVE', 'LIMITED', 'UNDER_REVIEW', 'REJECTED', 'BLOCKED');
CREATE TYPE "CommunityVerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'NEEDS_VERIFICATION');

ALTER TABLE "activities"
  ADD COLUMN "moderationStatus" "ListingModerationStatus" NOT NULL DEFAULT 'LIVE',
  ADD COLUMN "riskScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "riskFlags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "moderationNotes" TEXT;

ALTER TABLE "communities"
  ADD COLUMN "verificationStatus" "CommunityVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN "moderationStatus" "ListingModerationStatus" NOT NULL DEFAULT 'LIVE',
  ADD COLUMN "riskScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "riskFlags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "moderationNotes" TEXT;

UPDATE "communities"
SET "verificationStatus" = CASE WHEN "isVerified" THEN 'VERIFIED'::"CommunityVerificationStatus" ELSE 'UNVERIFIED'::"CommunityVerificationStatus" END;

ALTER TABLE "community_nominations"
  ADD COLUMN "communityId" VARCHAR(191),
  ADD COLUMN "moderationStatus" "ListingModerationStatus" NOT NULL DEFAULT 'UNDER_REVIEW',
  ADD COLUMN "riskScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "riskFlags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "moderationNotes" TEXT;

UPDATE "community_nominations"
SET "moderationStatus" = CASE
  WHEN "status" = 'APPROVED' THEN 'LIVE'::"ListingModerationStatus"
  WHEN "status" = 'REJECTED' THEN 'REJECTED'::"ListingModerationStatus"
  WHEN "status" = 'ARCHIVED' THEN 'REJECTED'::"ListingModerationStatus"
  ELSE 'UNDER_REVIEW'::"ListingModerationStatus"
END;

CREATE INDEX "activities_moderationStatus_idx" ON "activities"("moderationStatus");
CREATE INDEX "activities_riskScore_idx" ON "activities"("riskScore");
CREATE INDEX "communities_moderationStatus_idx" ON "communities"("moderationStatus");
CREATE INDEX "communities_verificationStatus_idx" ON "communities"("verificationStatus");
CREATE INDEX "communities_riskScore_idx" ON "communities"("riskScore");
CREATE INDEX "community_nominations_moderationStatus_createdAt_idx" ON "community_nominations"("moderationStatus", "createdAt");
CREATE INDEX "community_nominations_riskScore_idx" ON "community_nominations"("riskScore");
