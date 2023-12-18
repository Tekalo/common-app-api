-- AlterTable
ALTER TABLE "ApplicantSkills" RENAME COLUMN "dataAdded" TO "createdAt";

-- AlterTable
ALTER TABLE "OpportunitySkills" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
