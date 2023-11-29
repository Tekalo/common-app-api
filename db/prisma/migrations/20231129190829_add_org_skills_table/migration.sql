-- CreateTable
CREATE TABLE "OrgSkills" (
    "name" CITEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgSkills_name_key" ON "OrgSkills"("name");
