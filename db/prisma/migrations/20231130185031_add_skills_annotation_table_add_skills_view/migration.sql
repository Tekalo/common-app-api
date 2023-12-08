/*
  Warnings:

  - You are about to drop the `Skill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserSkills` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Skill";

-- DropIndex
DROP INDEX IF EXISTS "UserSkills_name_key";

-- Rename the table
ALTER TABLE "UserSkills"
RENAME TO "ApplicantSkills";

-- CreateIndex
CREATE UNIQUE INDEX "ApplicantSkills_name_key" ON "ApplicantSkills"("name");

-- CreateTable
CREATE TABLE "SkillsAnnotation" (
    "name" CITEXT NOT NULL,
    "canonical" TEXT,
    "suggest" BOOLEAN,
    "rejectAs" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "SkillsAnnotation_name_key" ON "SkillsAnnotation"("name");

-- AlterTable
ALTER TABLE "ApplicantSkills" ADD COLUMN     "dataAdded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "SkillsAnnotation" ALTER COLUMN "canonical" SET DATA TYPE CITEXT;

-- Create SkillsView table view
CREATE VIEW "SkillsView" AS
        SELECT
          COALESCE(sa.name, rs.name)::citext as name,
          COALESCE(sa.canonical, rs.name, sa.name)::citext as canonical,
          CASE
            WHEN sa.suggest IS NOT NULL THEN sa.suggest
            WHEN rs.name IS NOT NULL THEN true
            ELSE false
          END as suggest,
          sa."rejectAs" as "rejectAs"
        FROM "SkillsAnnotation" sa
        FULL JOIN "ReferenceSkills" rs ON sa.name = rs.name
