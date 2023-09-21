-- AlterTable
ALTER TABLE "ApplicantSubmission" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT '1970-01-01 00:00:00 +00:00', ALTER COLUMN updatedAt DROP DEFAULT;

UPDATE ApplicantSubmission
SET updatedAt = createdAt
WHERE updatedAt = '1970-01-01 00:00:00 +00:00';
