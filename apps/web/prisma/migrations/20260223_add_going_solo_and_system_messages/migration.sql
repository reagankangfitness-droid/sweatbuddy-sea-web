-- AlterTable
ALTER TABLE "user_activities" ADD COLUMN "goingSolo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "event_chat_messages" ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false;
