ALTER TABLE "event_submissions"
ADD COLUMN "city" VARCHAR(100),
ADD COLUMN "timezone" VARCHAR(100) DEFAULT 'Asia/Singapore';

UPDATE "event_submissions"
SET "city" = 'singapore',
    "timezone" = COALESCE("timezone", 'Asia/Singapore')
WHERE "city" IS NULL
  AND (
    LOWER("location") LIKE '%singapore%'
    OR ("latitude" BETWEEN 1.15 AND 1.50 AND "longitude" BETWEEN 103.55 AND 104.10)
  );

UPDATE "event_submissions"
SET "city" = 'bangkok',
    "timezone" = 'Asia/Bangkok',
    "currency" = CASE
      WHEN "currency" IS NULL OR "currency" = 'SGD' THEN 'THB'
      ELSE "currency"
    END
WHERE "city" IS NULL
  AND (
    LOWER("location") LIKE '%bangkok%'
    OR LOWER("location") LIKE '%bkk%'
    OR LOWER("location") LIKE '%thailand%'
    OR ("latitude" BETWEEN 13.45 AND 14.05 AND "longitude" BETWEEN 100.15 AND 100.90)
  );
