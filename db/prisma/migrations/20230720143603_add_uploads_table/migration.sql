-- CreateEnum
CREATE TYPE "UploadType" AS ENUM ('RESUME');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('REQUESTED', 'SUCCESS', 'FAILURE');

-- CreateTable
CREATE TABLE "Uploads" (
    "id" SERIAL NOT NULL,
    "applicantId" INTEGER NOT NULL,
    "type" "UploadType" NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "UploadStatus" DEFAULT 'REQUESTED',

    CONSTRAINT "Uploads_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Uploads" ADD CONSTRAINT "Uploads_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
