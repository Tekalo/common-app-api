-- CreateTable
CREATE TABLE "UserSkills" (
    "name" CITEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSkills_name_key" ON "UserSkills"("name");
