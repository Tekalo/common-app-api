-- CreateTable
CREATE TABLE "CausesAnnotation" (
    "name" CITEXT NOT NULL,
    "canonical" CITEXT,
    "suggest" BOOLEAN,
    "rejectAs" TEXT,
    "priority" BOOLEAN,

    CONSTRAINT "CausesAnnotation_pkey" PRIMARY KEY ("name")
);
