import { prisma } from '@App/resources/client.js';

// execute SQL command to create the view
// once created, view will automatically be updated whenever there are changes in source tables
await prisma.$executeRaw`
        CREATE OR REPLACE VIEW "SkillsView" AS
        SELECT
          COALESCE(sa.name, rs.name)::citext as name,
          CASE
            WHEN sa.suggest THEN COALESCE(sa.canonical, sa.name)::citext
            ELSE COALESCE(sa.canonical, rs.name)::citext
          END AS canonical,
          COALESCE(sa.suggest, rs.name IS NOT NULL) AS suggest,
          sa."rejectAs"
        FROM "SkillsAnnotation" sa
        FULL JOIN "ReferenceSkills" rs ON sa.name = rs.name
    `;
