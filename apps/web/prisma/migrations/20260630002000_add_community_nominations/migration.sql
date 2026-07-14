-- CreateEnum
CREATE TYPE "CommunityNominationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "community_nominations" (
    "id" TEXT NOT NULL,
    "status" "CommunityNominationStatus" NOT NULL DEFAULT 'PENDING',
    "communityName" VARCHAR(160) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "category" VARCHAR(80),
    "sourceUrl" VARCHAR(500) NOT NULL,
    "note" TEXT,
    "submitterName" VARCHAR(160),
    "submitterEmail" VARCHAR(255),
    "submitterUserId" VARCHAR(191),
    "ipHash" VARCHAR(120),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" VARCHAR(191),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_nominations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_nominations_status_createdAt_idx" ON "community_nominations"("status", "createdAt");

-- CreateIndex
CREATE INDEX "community_nominations_city_category_idx" ON "community_nominations"("city", "category");

-- CreateIndex
CREATE INDEX "community_nominations_submitterEmail_idx" ON "community_nominations"("submitterEmail");

-- CreateIndex
CREATE UNIQUE INDEX "community_nominations_sourceUrl_key" ON "community_nominations"("sourceUrl");
