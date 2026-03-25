-- AlterTable
ALTER TABLE "communities" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "communities" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "communities" ADD COLUMN "address" VARCHAR(500);
