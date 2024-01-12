-- CreateTable
CREATE TABLE "ApplicantCauses" (
    "name" CITEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicantCauses_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "OpportunityCauses" (
    "name" CITEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityCauses_pkey" PRIMARY KEY ("name")
);
