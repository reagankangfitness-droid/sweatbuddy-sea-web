CREATE TYPE "CommunityManagerTrustLevel" AS ENUM ('PENDING', 'VERIFIED_MANAGER', 'TRUSTED_MANAGER', 'RESTRICTED');
CREATE TYPE "CommunityClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "VerificationChallengeType" AS ENUM ('LINK_CODE');
CREATE TYPE "VerificationChallengeStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'EXPIRED');

ALTER TABLE "community_members"
  ADD COLUMN "managerTrustLevel" "CommunityManagerTrustLevel" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "managerVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "managerRestrictedAt" TIMESTAMP(3),
  ADD COLUMN "managerRestrictionReason" TEXT;

UPDATE "community_members"
SET "managerTrustLevel" = 'VERIFIED_MANAGER'::"CommunityManagerTrustLevel",
    "managerVerifiedAt" = COALESCE("managerVerifiedAt", "joinedAt")
WHERE "role" IN ('OWNER', 'ADMIN');

CREATE TABLE "community_claims" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "CommunityClaimStatus" NOT NULL DEFAULT 'PENDING',
    "sourceUrl" VARCHAR(500),
    "verificationUrl" VARCHAR(500) NOT NULL,
    "verificationCode" VARCHAR(32) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" VARCHAR(191),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_claims_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verification_challenges" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "type" "VerificationChallengeType" NOT NULL DEFAULT 'LINK_CODE',
    "status" "VerificationChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "code" VARCHAR(32) NOT NULL,
    "targetUrl" VARCHAR(500) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastCheckedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "community_claims_communityId_userId_key" ON "community_claims"("communityId", "userId");
CREATE INDEX "community_claims_communityId_status_idx" ON "community_claims"("communityId", "status");
CREATE INDEX "community_claims_userId_status_idx" ON "community_claims"("userId", "status");
CREATE INDEX "community_claims_status_createdAt_idx" ON "community_claims"("status", "createdAt");
CREATE INDEX "community_members_managerTrustLevel_idx" ON "community_members"("managerTrustLevel");
CREATE INDEX "verification_challenges_claimId_status_idx" ON "verification_challenges"("claimId", "status");
CREATE INDEX "verification_challenges_status_expiresAt_idx" ON "verification_challenges"("status", "expiresAt");

ALTER TABLE "community_claims" ADD CONSTRAINT "community_claims_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_claims" ADD CONSTRAINT "community_claims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "verification_challenges" ADD CONSTRAINT "verification_challenges_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "community_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
