SELECT
  NAME
FROM
  "ReferenceSkills"
WHERE
  NAME IS NOT NULL
UNION
SELECT
  NAME
FROM
  "ApplicantSkills"
WHERE
  NAME IS NOT NULL
UNION
SELECT
  NAME
FROM
  "OpportunitySkills"
WHERE
  NAME IS NOT NULL;



-- ONLY ON FIRST TIME LOAD RUN BELOW QUERY
SELECT
  NAME,
  NAME AS canon,
  TRUE AS suggest
FROM
  "ReferenceSkills”;