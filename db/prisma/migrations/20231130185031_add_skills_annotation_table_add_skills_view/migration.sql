/*
  Warnings:

  - You are about to drop the `Skill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserSkills` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Skill";

-- DropTable
DROP TABLE "UserSkills";

-- CreateTable
CREATE TABLE "ApplicantSkills" (
    "name" CITEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SkillsAnnotation" (
    "name" CITEXT NOT NULL,
    "canonical" TEXT,
    "suggest" BOOLEAN,
    "rejectAs" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "ApplicantSkills_name_key" ON "ApplicantSkills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SkillsAnnotation_name_key" ON "SkillsAnnotation"("name");

-- Create SkillsView table view
CREATE VIEW "SkillsView" AS
        SELECT
          COALESCE(sa.name::citext, rs.name::citext) as name,
          COALESCE(sa.canonical, rs.name, sa.name) as canonical,
          CASE
            WHEN sa.suggest IS NOT NULL THEN sa.suggest
            WHEN rs.name IS NOT NULL THEN true
            ELSE false
          END as suggest,
          sa."rejectAs" as "rejectAs"
        FROM "SkillsAnnotation" sa
        FULL JOIN "ReferenceSkills" rs ON sa.name = rs.name

