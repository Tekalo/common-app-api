import { prisma } from '@App/resources/client.js';

// execute SQL command to create the view
// once created, view will automatically be updated whenever there are changes in source tables
await prisma.$executeRaw`
CREATE OR REPLACE VIEW "CausesView" AS
  SELECT
    name::citext as name,
    CASE
      WHEN suggest THEN COALESCE(canonical, name)::citext
      ELSE canonical::citext
    END AS canonical,
    suggest,
    "rejectAs",
    COALESCE(priority, false) as priority
  FROM "CausesAnnotation";
`;
