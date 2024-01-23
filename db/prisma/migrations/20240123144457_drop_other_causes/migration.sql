/*
  Warnings:

  - You are about to drop the column `otherCauses` on the `ApplicantDraftSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `otherCauses` on the `ApplicantSubmission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ApplicantDraftSubmission" DROP COLUMN "otherCauses";

-- AlterTable
ALTER TABLE "ApplicantSubmission" DROP COLUMN "otherCauses";
