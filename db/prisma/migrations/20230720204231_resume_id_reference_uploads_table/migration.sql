/*
  Warnings:

  - The `resumeId` column on the `ApplicantDraftSubmission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `resumeId` column on the `ApplicantSubmission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Uploads` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[resumeId]` on the table `ApplicantDraftSubmission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resumeId]` on the table `ApplicantSubmission` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Uploads" DROP CONSTRAINT "Uploads_applicantId_fkey";

-- AlterTable
ALTER TABLE "ApplicantDraftSubmission" DROP COLUMN "resumeId",
ADD COLUMN     "resumeId" INTEGER;

-- AlterTable
ALTER TABLE "ApplicantSubmission" DROP COLUMN "resumeId",
ADD COLUMN     "resumeId" INTEGER;

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
CREATE UNIQUE INDEX "ApplicantDraftSubmission_resumeId_key" ON "ApplicantDraftSubmission"("resumeId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicantSubmission_resumeId_key" ON "ApplicantSubmission"("resumeId");

-- AddForeignKey
ALTER TABLE "ApplicantSubmission" ADD CONSTRAINT "ApplicantSubmission_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantDraftSubmission" ADD CONSTRAINT "ApplicantDraftSubmission_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
