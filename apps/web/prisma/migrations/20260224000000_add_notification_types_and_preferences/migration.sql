-- Add new values to NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FRIEND_RSVP';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EVENT_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NEW_FOLLOWER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BUDDY_MATCH';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WAITLIST_PROMOTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'HOST_ANNOUNCEMENT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EVENT_RECAP';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PASSPORT_BADGE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'COMMUNITY_WELCOME';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'STREAK_REMINDER';

-- Add imageUrl column to notifications
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Add typeOverrides column to notification_preferences (with default empty JSON)
ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "typeOverrides" JSONB NOT NULL DEFAULT '{}';

-- Migrate existing per-type booleans into typeOverrides JSON
UPDATE "notification_preferences"
SET "typeOverrides" = (
  SELECT jsonb_strip_nulls(jsonb_build_object(
    'MENTION', CASE WHEN "mentionEnabled" = false THEN jsonb_build_object('inApp', false) ELSE NULL END,
    'MESSAGE', CASE WHEN "messageEnabled" = false THEN jsonb_build_object('inApp', false) ELSE NULL END,
    'ACTIVITY_UPDATE', CASE WHEN "activityEnabled" = false THEN jsonb_build_object('inApp', false) ELSE NULL END,
    'NUDGE', CASE WHEN "nudgeEnabled" = false THEN jsonb_build_object('inApp', false) ELSE NULL END
  ))
)
WHERE "mentionEnabled" = false
   OR "messageEnabled" = false
   OR "activityEnabled" = false
   OR "nudgeEnabled" = false;

-- Drop old per-type boolean columns
ALTER TABLE "notification_preferences" DROP COLUMN IF EXISTS "mentionEnabled";
ALTER TABLE "notification_preferences" DROP COLUMN IF EXISTS "messageEnabled";
ALTER TABLE "notification_preferences" DROP COLUMN IF EXISTS "activityEnabled";
ALTER TABLE "notification_preferences" DROP COLUMN IF EXISTS "nudgeEnabled";
