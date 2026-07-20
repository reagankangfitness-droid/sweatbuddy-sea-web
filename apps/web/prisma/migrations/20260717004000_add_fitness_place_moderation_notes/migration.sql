-- Add internal review notes for aggregated fitness place moderation.
ALTER TABLE "fitness_places"
ADD COLUMN "moderationNotes" TEXT;
