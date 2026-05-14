-- Add a durable Clerk identity column without changing existing primary keys.
ALTER TABLE "users" ADD COLUMN "clerkUserId" TEXT;

-- Existing rows created directly from Clerk used the Clerk id as User.id.
UPDATE "users"
SET "clerkUserId" = "id"
WHERE "id" LIKE 'user_%';

CREATE UNIQUE INDEX "users_clerkUserId_key" ON "users"("clerkUserId");
