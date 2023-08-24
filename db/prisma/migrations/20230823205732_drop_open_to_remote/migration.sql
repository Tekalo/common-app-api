/*
  Warnings:

  - You are about to drop the column `openToRemote` on the `ApplicantDraftSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `openToRemote` on the `ApplicantSubmission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ApplicantDraftSubmission" DROP COLUMN "openToRemote";

-- AlterTable
ALTER TABLE "ApplicantSubmission" DROP COLUMN "openToRemote";
