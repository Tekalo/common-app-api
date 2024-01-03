/**
 * The hard-coded '2023-12-01' references the day the ReferenceSkills were first loaded into the database
 */
SELECT
  COALESCE(rs.name, as2.name, os.name) AS NAME,
  COALESCE(
    LEAST(as2."createdAt", os."createdAt"),
    '2023-12-01T05:00:00' :: TIMESTAMP
  ) AS "createdAt"
FROM
  "ReferenceSkills" rs
  FULL JOIN "ApplicantSkills" as2 ON as2.name = rs.name
  FULL JOIN "OpportunitySkills" os ON os.name = COALESCE(rs.name, as2.name)
WHERE
  COALESCE(rs.name, as2.name, os.name) IS NOT NULL
ORDER BY
  "createdAt" DESC;


-- Only run below on first-time load
SELECT
    rs.name,
    rs.name as canonical,
    '2023-12-01T05:00:00' :: TIMESTAMP as "createdAt",
    true as suggest
FROM "ReferenceSkills" rs
WHERE rs.name is not null;