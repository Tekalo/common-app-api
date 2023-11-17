/*
  Warnings:

  - You are about to drop the `Skill` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Skill";

-- CreateTable
CREATE TABLE "UserSkills" (
    "name" CITEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSkills_name_key" ON "UserSkills"("name");
