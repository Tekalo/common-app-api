/*
  Warnings:

  - The `resumeUploadId` column on the `ApplicantDraftSubmission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `resumeUploadId` column on the `ApplicantSubmission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Uploads` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Uploads" DROP CONSTRAINT "Uploads_applicantId_fkey";

-- AlterTable
ALTER TABLE "ApplicantDraftSubmission" DROP COLUMN "resumeUploadId",
ADD COLUMN     "resumeUploadId" INTEGER;

-- AlterTable
ALTER TABLE "ApplicantSubmission" DROP COLUMN "resumeUploadId",
ADD COLUMN     "resumeUploadId" INTEGER;

-- DropTable
DROP TABLE "Uploads";

-- CreateTable
CREATE TABLE "Upload" (
    "id" SERIAL NOT NULL,
    "applicantId" INTEGER NOT NULL,
    "type" "UploadType" NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "UploadStatus" NOT NULL DEFAULT 'REQUESTED',
    "applicantSubmissionId" INTEGER NOT NULL,
    "applicantDraftSubmissionId" INTEGER NOT NULL,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Upload_applicantSubmissionId_key" ON "Upload"("applicantSubmissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Upload_applicantDraftSubmissionId_key" ON "Upload"("applicantDraftSubmissionId");

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_applicantSubmissionId_fkey" FOREIGN KEY ("applicantSubmissionId") REFERENCES "ApplicantSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_applicantDraftSubmissionId_fkey" FOREIGN KEY ("applicantDraftSubmissionId") REFERENCES "ApplicantDraftSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
