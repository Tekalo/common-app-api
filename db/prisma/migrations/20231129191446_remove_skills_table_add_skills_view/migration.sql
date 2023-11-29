/*
  Warnings:

  - You are about to drop the column `canonicalSkill` on the `SkillsAnnotation` table. All the data in the column will be lost.
  - You are about to drop the `Skill` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "SkillsAnnotation" DROP COLUMN "canonicalSkill",
ADD COLUMN     "canonical" TEXT,
ALTER COLUMN "suggest" DROP NOT NULL,
ALTER COLUMN "rejectAs" DROP NOT NULL;

-- DropTable
DROP TABLE "Skill";

-- Create SkillsView table view
CREATE VIEW "SkillsView" AS
    SELECT
        sa.name as name,
        COALESCE(sa.canonical, rs.name, sa.name) as canonical,
        CASE
        WHEN sa.suggest IS NOT NULL THEN sa.suggest
        WHEN rs.name IS NOT NULL THEN true
        ELSE false
        END as suggest,
        sa."rejectAs" as "rejectAs"
    FROM "SkillsAnnotation" sa
    LEFT JOIN "ReferenceSkills" rs ON LOWER(sa.name) = LOWER(rs.name)
