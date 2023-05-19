-- CreateTable
CREATE TABLE "ApplicantSession" (
    "sid" TEXT NOT NULL,
    "sess" JSONB NOT NULL,
    "expire" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicantSession_pkey" PRIMARY KEY ("sid")
);

-- CreateTable
CREATE TABLE "Applicant" (
    "id" SERIAL NOT NULL,
    "auth0Id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "pronoun" TEXT,
    "preferredContact" TEXT NOT NULL,
    "searchStatus" TEXT NOT NULL,
    "acceptedTerms" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedPrivacy" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followUpOptIn" BOOLEAN NOT NULL DEFAULT false,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicantSubmission" (
    "id" SERIAL NOT NULL,
    "applicantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originTag" TEXT NOT NULL,
    "resumeUrl" TEXT,
    "resumePassword" TEXT,
    "lastOrg" TEXT NOT NULL,
    "lastRole" TEXT NOT NULL,
    "yoe" TEXT NOT NULL,
    "linkedInUrl" TEXT,
    "githubUrl" TEXT,
    "portfolioUrl" TEXT,
    "portfolioPassword" TEXT,
    "interestEmploymentType" TEXT[],
    "interestRoles" TEXT[],
    "interestCauses" TEXT[],
    "interestGovt" BOOLEAN NOT NULL,
    "interestGovtEmplTypes" TEXT[],
    "otherCauses" TEXT[],
    "skills" TEXT[],
    "otherSkills" TEXT[],
    "currentLocation" TEXT NOT NULL,
    "openToRelocate" TEXT NOT NULL,
    "openToRemote" TEXT NOT NULL,
    "desiredSalary" TEXT,
    "previousImpactExperience" BOOLEAN NOT NULL,
    "workAuthorization" TEXT,
    "hoursPerWeek" TEXT,
    "essayResponse" TEXT NOT NULL,
    "referenceAttribution" TEXT,

    CONSTRAINT "ApplicantSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicantDraftSubmission" (
    "id" SERIAL NOT NULL,
    "applicantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "originTag" TEXT,
    "resumeUrl" TEXT,
    "resumePassword" TEXT,
    "lastOrg" TEXT,
    "lastRole" TEXT,
    "yoe" TEXT,
    "linkedInUrl" TEXT,
    "githubUrl" TEXT,
    "portfolioUrl" TEXT,
    "portfolioPassword" TEXT,
    "interestEmploymentType" TEXT[],
    "interestRoles" TEXT[],
    "interestCauses" TEXT[],
    "interestGovt" BOOLEAN,
    "interestGovtEmplTypes" TEXT[],
    "otherCauses" TEXT[],
    "skills" TEXT[],
    "otherSkills" TEXT[],
    "currentLocation" TEXT,
    "openToRelocate" TEXT,
    "openToRemote" TEXT,
    "desiredSalary" TEXT,
    "previousImpactExperience" BOOLEAN,
    "workAuthorization" TEXT,
    "hoursPerWeek" TEXT,
    "essayResponse" TEXT,
    "referenceAttribution" TEXT,

    CONSTRAINT "ApplicantDraftSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityBatch" (
    "id" SERIAL NOT NULL,
    "orgName" TEXT NOT NULL,
    "orgType" TEXT NOT NULL,
    "orgSize" TEXT NOT NULL,
    "impactAreas" TEXT[],
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "equalOpportunityEmployer" BOOLEAN NOT NULL,
    "acceptedPrivacy" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicantDeletionRequests" (
    "id" SERIAL NOT NULL,
    "applicantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "acceptedTerms" TIMESTAMP(3) NOT NULL,
    "acceptedPrivacy" TIMESTAMP(3) NOT NULL,
    "followUpOptIn" BOOLEAN NOT NULL,

    CONSTRAINT "ApplicantDeletionRequests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunitySubmission" (
    "id" SERIAL NOT NULL,
    "opportunityBatchId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "paid" BOOLEAN NOT NULL,
    "roleType" TEXT NOT NULL,
    "salaryRange" TEXT,
    "positionTitle" TEXT NOT NULL,
    "fullyRemote" BOOLEAN NOT NULL,
    "location" TEXT,
    "visaSponsorship" TEXT,
    "desiredHoursPerWeek" TEXT,
    "desiredStartDate" TIMESTAMP(3),
    "desiredEndDate" TIMESTAMP(3),
    "desiredYoe" TEXT[],
    "desiredSkills" TEXT[],
    "desiredOtherSkills" TEXT[],
    "desiredImpactExp" TEXT,
    "similarStaffed" BOOLEAN,
    "jdUrl" TEXT,
    "pitchEssay" TEXT NOT NULL,

    CONSTRAINT "OpportunitySubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_auth0Id_key" ON "Applicant"("auth0Id");

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_email_key" ON "Applicant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicantSubmission_applicantId_key" ON "ApplicantSubmission"("applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicantDraftSubmission_applicantId_key" ON "ApplicantDraftSubmission"("applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicantDeletionRequests_applicantId_key" ON "ApplicantDeletionRequests"("applicantId");

-- AddForeignKey
ALTER TABLE "ApplicantSubmission" ADD CONSTRAINT "ApplicantSubmission_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantDraftSubmission" ADD CONSTRAINT "ApplicantDraftSubmission_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunitySubmission" ADD CONSTRAINT "OpportunitySubmission_opportunityBatchId_fkey" FOREIGN KEY ("opportunityBatchId") REFERENCES "OpportunityBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

