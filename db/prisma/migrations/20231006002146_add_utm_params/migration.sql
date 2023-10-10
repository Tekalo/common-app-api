-- CreateTable
CREATE TABLE "UTMParams" (
    "id" SERIAL NOT NULL,
    "event" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "applicantSubmissionId" INTEGER,
    "applicantDraftSubmissionId" INTEGER,
    "opportunityBatchId" INTEGER,
    "applicantId" INTEGER,

    CONSTRAINT "UTMParams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UTMParams_applicantSubmissionId_key" ON "UTMParams"("applicantSubmissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UTMParams_applicantDraftSubmissionId_key" ON "UTMParams"("applicantDraftSubmissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UTMParams_opportunityBatchId_key" ON "UTMParams"("opportunityBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "UTMParams_applicantId_key" ON "UTMParams"("applicantId");

-- AddForeignKey
ALTER TABLE "UTMParams" ADD CONSTRAINT "UTMParams_applicantSubmissionId_fkey" FOREIGN KEY ("applicantSubmissionId") REFERENCES "ApplicantSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UTMParams" ADD CONSTRAINT "UTMParams_applicantDraftSubmissionId_fkey" FOREIGN KEY ("applicantDraftSubmissionId") REFERENCES "ApplicantDraftSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UTMParams" ADD CONSTRAINT "UTMParams_opportunityBatchId_fkey" FOREIGN KEY ("opportunityBatchId") REFERENCES "OpportunityBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UTMParams" ADD CONSTRAINT "UTMParams_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
