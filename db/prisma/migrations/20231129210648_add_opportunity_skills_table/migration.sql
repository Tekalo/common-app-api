-- CreateTable
CREATE TABLE "OpportunitySkills" (
    "name" CITEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "OpportunitySkills_name_key" ON "OpportunitySkills"("name");

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