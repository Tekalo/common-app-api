-- AlterTable
ALTER TABLE "ApplicantDraftSubmission" ADD COLUMN     "openToRemoteMulti" TEXT[];

-- AlterTable
ALTER TABLE "ApplicantSubmission" ADD COLUMN     "openToRemoteMulti" TEXT[],
ALTER COLUMN "openToRemote" DROP NOT NULL;
