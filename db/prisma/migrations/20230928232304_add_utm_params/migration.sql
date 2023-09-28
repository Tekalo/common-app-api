/*
  Warnings:

  - A unique constraint covering the columns `[utmParamsId]` on the table `Applicant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[utmParamsId]` on the table `ApplicantDraftSubmission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[utmParamsId]` on the table `ApplicantSubmission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[utmParamsId]` on the table `OpportunityBatch` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Applicant" ADD COLUMN     "utmParamsId" INTEGER;

-- AlterTable
ALTER TABLE "ApplicantDraftSubmission" ADD COLUMN     "utmParamsId" INTEGER;

-- AlterTable
ALTER TABLE "ApplicantSubmission" ADD COLUMN     "utmParamsId" INTEGER;

-- AlterTable
ALTER TABLE "OpportunityBatch" ADD COLUMN     "utmParamsId" INTEGER;

-- CreateTable
CREATE TABLE "UTMParams" (
    "id" SERIAL NOT NULL,
    "event" TEXT NOT NULL,
    "params" JSONB NOT NULL,

    CONSTRAINT "UTMParams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_utmParamsId_key" ON "Applicant"("utmParamsId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicantDraftSubmission_utmParamsId_key" ON "ApplicantDraftSubmission"("utmParamsId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicantSubmission_utmParamsId_key" ON "ApplicantSubmission"("utmParamsId");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityBatch_utmParamsId_key" ON "OpportunityBatch"("utmParamsId");

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_utmParamsId_fkey" FOREIGN KEY ("utmParamsId") REFERENCES "UTMParams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantSubmission" ADD CONSTRAINT "ApplicantSubmission_utmParamsId_fkey" FOREIGN KEY ("utmParamsId") REFERENCES "UTMParams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantDraftSubmission" ADD CONSTRAINT "ApplicantDraftSubmission_utmParamsId_fkey" FOREIGN KEY ("utmParamsId") REFERENCES "UTMParams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityBatch" ADD CONSTRAINT "OpportunityBatch_utmParamsId_fkey" FOREIGN KEY ("utmParamsId") REFERENCES "UTMParams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
