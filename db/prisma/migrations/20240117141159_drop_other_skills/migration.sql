/*
  Warnings:

  - You are about to drop the column `otherSkills` on the `ApplicantDraftSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `otherSkills` on the `ApplicantSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `desiredOtherSkills` on the `OpportunitySubmission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ApplicantDraftSubmission" DROP COLUMN "otherSkills";

-- AlterTable
ALTER TABLE "ApplicantSubmission" DROP COLUMN "otherSkills";

-- AlterTable
ALTER TABLE "OpportunitySubmission" DROP COLUMN "desiredOtherSkills";
