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



-- ! CAUTION !
-- The below query is used to add defaults to the values from referenceSkills
-- When running this query instead, make sure it's either the first time data is being loaded to the table
-- or that the sync is configured to upsert, the fields are all mapped, and missing values will not be deleted
-- Please be aware that running this query will overwrite any changes made to skills from referenceSkills in Airtrable
SELECT
  NAME,
  NAME AS canon,
  TRUE AS suggest
FROM
  "ReferenceSkills";