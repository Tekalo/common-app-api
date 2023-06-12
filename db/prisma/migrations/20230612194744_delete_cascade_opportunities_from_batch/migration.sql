-- DropForeignKey
ALTER TABLE "OpportunitySubmission" DROP CONSTRAINT "OpportunitySubmission_opportunityBatchId_fkey";

-- AddForeignKey
ALTER TABLE "OpportunitySubmission" ADD CONSTRAINT "OpportunitySubmission_opportunityBatchId_fkey" FOREIGN KEY ("opportunityBatchId") REFERENCES "OpportunityBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
