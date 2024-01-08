-- AlterTable
ALTER TABLE "SkillsAnnotation" ADD COLUMN     "priority" BOOLEAN;

-- Add priority column to SkillsView
CREATE OR REPLACE VIEW "SkillsView" AS
    SELECT
      COALESCE(sa.name, rs.name)::citext as name,
      CASE
        WHEN sa.suggest THEN COALESCE(sa.canonical, sa.name)::citext
        ELSE COALESCE(sa.canonical, rs.name)::citext
      END AS canonical,
      COALESCE(sa.suggest, rs.name IS NOT NULL) AS suggest,
      sa."rejectAs",
      COALESCE(sa.priority, false) as priority
    FROM "SkillsAnnotation" sa
    FULL JOIN "ReferenceSkills" rs ON sa.name = rs.name;