-- CreateTable
CREATE TABLE "OpportunitySkills" (
    "name" CITEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "OpportunitySkills_name_key" ON "OpportunitySkills"("name");
