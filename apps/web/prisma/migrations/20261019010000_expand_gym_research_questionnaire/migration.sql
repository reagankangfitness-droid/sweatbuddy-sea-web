ALTER TABLE "gym_research_responses"
  ADD COLUMN "chosenGym" VARCHAR(200),
  ADD COLUMN "decisionReason" TEXT,
  ADD COLUMN "almostStoppedReason" TEXT,
  ADD COLUMN "monthlyPrice" VARCHAR(120),
  ADD COLUMN "researchTime" VARCHAR(40),
  ADD COLUMN "priorityFactors" JSONB,
  ADD COLUMN "decidingFactor" VARCHAR(80),
  ADD COLUMN "conceptUsefulness" VARCHAR(40),
  ADD COLUMN "firstFeature" VARCHAR(80),
  ADD COLUMN "verifyYourself" TEXT,
  ADD COLUMN "distrustReason" TEXT,
  ADD COLUMN "earlyAccessConsent" BOOLEAN NOT NULL DEFAULT false;
