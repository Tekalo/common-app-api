/*
  Warnings:

  - The `resumeUploadId` column on the `ApplicantDraftSubmission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `resumeUploadId` column on the `ApplicantSubmission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Uploads` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[resumeUploadId]` on the table `ApplicantDraftSubmission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resumeUploadId]` on the table `ApplicantSubmission` will be added. If there are existing duplicate values, this will fail.

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

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApplicantDraftSubmission_resumeUploadId_key" ON "ApplicantDraftSubmission"("resumeUploadId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicantSubmission_resumeUploadId_key" ON "ApplicantSubmission"("resumeUploadId");

-- AddForeignKey
ALTER TABLE "ApplicantSubmission" ADD CONSTRAINT "ApplicantSubmission_resumeUploadId_fkey" FOREIGN KEY ("resumeUploadId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantDraftSubmission" ADD CONSTRAINT "ApplicantDraftSubmission_resumeUploadId_fkey" FOREIGN KEY ("resumeUploadId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
