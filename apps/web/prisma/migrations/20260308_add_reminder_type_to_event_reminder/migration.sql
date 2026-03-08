-- AlterTable: Add reminderType column to event_reminders
ALTER TABLE "event_reminders" ADD COLUMN "reminderType" "ReminderType" NOT NULL DEFAULT 'ONE_DAY';

-- DropIndex: Remove old unique constraint on attendanceId
DROP INDEX IF EXISTS "event_reminders_attendanceId_key";

-- CreateIndex: Add composite unique constraint
CREATE UNIQUE INDEX "event_reminders_attendanceId_reminderType_key" ON "event_reminders"("attendanceId", "reminderType");
