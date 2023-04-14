SELECT
  apl.name,
  apl.email,
  apl.phone,
  apl.pronoun,
  apl."preferredContact",
  apl."searchStatus",
  appsub.id,
  appsub."applicantId",
  appsub."createdAt",
  appsub."originTag",
  appsub."resumeUrl",
  appsub."resumePassword",
  appsub."lastOrg",
  appsub."lastRole",
  appsub.yoe,
  appsub."linkedInUrl",
  appsub."githubUrl",
  appsub."portfolioUrl",
  appsub."portfolioPassword",
  appsub."interestEmploymentType",
  appsub."interestRoles",
  appsub."interestGovt",
  appsub."interestGovtEmplTypes",
  ARRAY_CAT(
    appsub."interestCauses",
    STRING_TO_ARRAY(appsub."otherCause", ',')
  ) AS "allCauses",
  -- ARRAY_CAT(appsub."interestCauses", appsub."otherCauses") AS "allCauses",  -- Uncomment if/when otherCause becomes otherCauses
  ARRAY_CAT(appsub.skills, appsub."otherSkills") AS "allSkills",
  appsub."currentLocation",
  appsub."openToRelocate",
  appsub."openToRemote",
  appsub."desiredSalary",
  appsub."previousImpactExperience",
  appsub."workAuthorization",
  appsub."hoursPerWeek",
  appsub."essayResponse"
FROM
  PUBLIC."ApplicantSubmission" appsub
  LEFT JOIN PUBLIC."Applicant" apl ON appsub."applicantId" = apl.id;