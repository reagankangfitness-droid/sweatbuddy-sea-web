-- CreateEnum
CREATE TYPE "FitnessPlaceType" AS ENUM ('GYM', 'STUDIO', 'OUTDOOR_FITNESS', 'SPORTS_FACILITY', 'WELLNESS', 'COMMUNITY_SPACE');

-- CreateTable
CREATE TABLE "fitness_places" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "placeType" "FitnessPlaceType" NOT NULL,
  "cityId" TEXT,
  "area" VARCHAR(160),
  "address" VARCHAR(500),
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "coverImage" TEXT,
  "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "activities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "amenities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "vibeTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "communityTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "priceSummary" VARCHAR(180),
  "trialSummary" VARCHAR(180),
  "bestFor" VARCHAR(240),
  "bestTimes" VARCHAR(180),
  "dropInFriendly" BOOLEAN NOT NULL DEFAULT false,
  "beginnerFriendly" BOOLEAN NOT NULL DEFAULT false,
  "socialScore" INTEGER NOT NULL DEFAULT 0,
  "googlePlaceId" TEXT,
  "websiteUrl" VARCHAR(500),
  "instagramHandle" VARCHAR(100),
  "bookingUrl" VARCHAR(500),
  "sourceUrl" VARCHAR(500),
  "averageRating" DECIMAL(3,2) NOT NULL DEFAULT 0,
  "reviewCount" INTEGER NOT NULL DEFAULT 0,
  "moderationStatus" "ListingModerationStatus" NOT NULL DEFAULT 'LIVE',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "isSeeded" BOOLEAN NOT NULL DEFAULT false,
  "lastVerifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "fitness_places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fitness_place_communities" (
  "id" TEXT NOT NULL,
  "placeId" TEXT NOT NULL,
  "communityId" TEXT NOT NULL,
  "relationshipSummary" VARCHAR(240),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fitness_place_communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fitness_place_reviews" (
  "id" TEXT NOT NULL,
  "placeId" TEXT NOT NULL,
  "reviewerId" TEXT,
  "rating" INTEGER NOT NULL,
  "title" VARCHAR(200),
  "content" TEXT,
  "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "vibeTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "helpfulCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "fitness_place_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fitness_places_slug_key" ON "fitness_places"("slug");
CREATE UNIQUE INDEX "fitness_places_googlePlaceId_key" ON "fitness_places"("googlePlaceId");
CREATE INDEX "fitness_places_cityId_idx" ON "fitness_places"("cityId");
CREATE INDEX "fitness_places_slug_idx" ON "fitness_places"("slug");
CREATE INDEX "fitness_places_placeType_idx" ON "fitness_places"("placeType");
CREATE INDEX "fitness_places_area_idx" ON "fitness_places"("area");
CREATE INDEX "fitness_places_isActive_moderationStatus_idx" ON "fitness_places"("isActive", "moderationStatus");
CREATE INDEX "fitness_places_isFeatured_idx" ON "fitness_places"("isFeatured");
CREATE INDEX "fitness_places_socialScore_idx" ON "fitness_places"("socialScore");
CREATE UNIQUE INDEX "fitness_place_communities_placeId_communityId_key" ON "fitness_place_communities"("placeId", "communityId");
CREATE INDEX "fitness_place_communities_communityId_idx" ON "fitness_place_communities"("communityId");
CREATE INDEX "fitness_place_reviews_placeId_status_createdAt_idx" ON "fitness_place_reviews"("placeId", "status", "createdAt");
CREATE INDEX "fitness_place_reviews_reviewerId_idx" ON "fitness_place_reviews"("reviewerId");
CREATE INDEX "fitness_place_reviews_rating_idx" ON "fitness_place_reviews"("rating");
CREATE INDEX "fitness_place_reviews_status_helpfulCount_idx" ON "fitness_place_reviews"("status", "helpfulCount");

-- AddForeignKey
ALTER TABLE "fitness_places" ADD CONSTRAINT "fitness_places_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fitness_place_communities" ADD CONSTRAINT "fitness_place_communities_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "fitness_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fitness_place_communities" ADD CONSTRAINT "fitness_place_communities_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fitness_place_reviews" ADD CONSTRAINT "fitness_place_reviews_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "fitness_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fitness_place_reviews" ADD CONSTRAINT "fitness_place_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
