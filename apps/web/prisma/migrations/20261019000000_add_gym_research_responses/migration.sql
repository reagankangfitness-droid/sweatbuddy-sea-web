CREATE TABLE "gym_research_responses" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(80),
    "recentAction" VARCHAR(50) NOT NULL,
    "actionTiming" VARCHAR(40) NOT NULL,
    "gymsConsidered" TEXT,
    "currentGym" VARCHAR(200),
    "trainingFrequency" VARCHAR(40) NOT NULL,
    "trainingStyles" JSONB NOT NULL,
    "researchActions" JSONB NOT NULL,
    "informationGaps" JSONB NOT NULL,
    "biggestSurprise" TEXT,
    "contributionIntent" JSONB NOT NULL,
    "paidReportIntent" VARCHAR(40) NOT NULL,
    "interviewConsent" BOOLEAN NOT NULL DEFAULT false,
    "interviewAvailability" VARCHAR(300),
    "researchConsent" BOOLEAN NOT NULL DEFAULT false,
    "eligibilityScore" INTEGER NOT NULL DEFAULT 0,
    "qualified" BOOLEAN NOT NULL DEFAULT false,
    "source" VARCHAR(120),
    "utmSource" VARCHAR(120),
    "utmMedium" VARCHAR(120),
    "utmCampaign" VARCHAR(160),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gym_research_responses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "gym_research_responses_email_key" ON "gym_research_responses"("email");
CREATE INDEX "gym_research_responses_qualified_createdAt_idx" ON "gym_research_responses"("qualified", "createdAt");
CREATE INDEX "gym_research_responses_recentAction_actionTiming_idx" ON "gym_research_responses"("recentAction", "actionTiming");
CREATE INDEX "gym_research_responses_paidReportIntent_idx" ON "gym_research_responses"("paidReportIntent");
