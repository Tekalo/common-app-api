/*
  Warnings:

  - The `resumeId` column on the `ApplicantDraftSubmission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `resumeId` column on the `ApplicantSubmission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[applicantSubmissionId]` on the table `Uploads` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[applicantDraftSubmissionId]` on the table `Uploads` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `applicantDraftSubmissionId` to the `Uploads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `applicantSubmissionId` to the `Uploads` table without a default value. This is not possible if the table is not empty.
  - Made the column `status` on table `Uploads` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ApplicantDraftSubmission" DROP COLUMN "resumeId",
ADD COLUMN     "resumeId" INTEGER;

-- AlterTable
ALTER TABLE "ApplicantSubmission" DROP COLUMN "resumeId",
ADD COLUMN     "resumeId" INTEGER;

-- AlterTable
ALTER TABLE "Uploads" ADD COLUMN     "applicantDraftSubmissionId" INTEGER NOT NULL,
ADD COLUMN     "applicantSubmissionId" INTEGER NOT NULL,
ALTER COLUMN "status" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Uploads_applicantSubmissionId_key" ON "Uploads"("applicantSubmissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Uploads_applicantDraftSubmissionId_key" ON "Uploads"("applicantDraftSubmissionId");

-- AddForeignKey
ALTER TABLE "Uploads" ADD CONSTRAINT "Uploads_applicantSubmissionId_fkey" FOREIGN KEY ("applicantSubmissionId") REFERENCES "ApplicantSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Uploads" ADD CONSTRAINT "Uploads_applicantDraftSubmissionId_fkey" FOREIGN KEY ("applicantDraftSubmissionId") REFERENCES "ApplicantDraftSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
