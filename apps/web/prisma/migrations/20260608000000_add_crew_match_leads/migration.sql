CREATE TABLE "crew_match_leads" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(30) NOT NULL DEFAULT 'USER',
    "status" VARCHAR(30) NOT NULL DEFAULT 'NEW',
    "city" VARCHAR(80),
    "activityType" VARCHAR(80),
    "comfortLevel" VARCHAR(80),
    "contactMethod" VARCHAR(30),
    "email" VARCHAR(255),
    "phone" VARCHAR(80),
    "name" VARCHAR(200),
    "communityName" VARCHAR(200),
    "contactLink" VARCHAR(500),
    "sourcePage" VARCHAR(200),
    "sourcePlacement" VARCHAR(120),
    "utmSource" VARCHAR(120),
    "utmMedium" VARCHAR(120),
    "utmCampaign" VARCHAR(160),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crew_match_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "crew_match_leads_type_createdAt_idx" ON "crew_match_leads"("type", "createdAt");
CREATE INDEX "crew_match_leads_city_activityType_idx" ON "crew_match_leads"("city", "activityType");
CREATE INDEX "crew_match_leads_status_idx" ON "crew_match_leads"("status");
CREATE INDEX "crew_match_leads_email_idx" ON "crew_match_leads"("email");
