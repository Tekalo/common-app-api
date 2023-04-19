SELECT
  apl.name,
  apl.email,
  apl.phone,
  apl.pronoun,
  CASE
    apl."preferredContact"
    WHEN 'sms' THEN 'Text message'
    WHEN 'whatsapp' THEN 'WhatsApp message'
    WHEN 'email' THEN 'Email'
    ELSE apl."preferredContact"
  END "preferredContact",
  CASE
    apl."searchStatus"
    WHEN 'active' THEN 'Actively looking'
    WHEN 'passive' THEN 'Flexible, casually looking'
    WHEN 'future' THEN 'Want to stay in touch for future opportunities'
    ELSE apl."searchStatus"
  END "searchStatus",
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
  (
    SELECT
      ARRAY_AGG(
        CASE
          x
          WHEN 'full' THEN 'Full-time'
          WHEN 'part' THEN 'Part-time / short-term'
          ELSE x
        END
      )
    FROM
      UNNEST(appsub."interestEmploymentType") AS x
  ) AS "interestEmploymentType",
  appsub."interestRoles",
  appsub."interestGovt",
  appsub."interestGovtEmplTypes",
  ARRAY_CAT(appsub."interestCauses", appsub."otherCauses") AS "allCauses",
  ARRAY_CAT(appsub.skills, appsub."otherSkills") AS "allSkills",
  appsub."currentLocation",
  appsub."openToRelocate",
  appsub."openToRemote",
  appsub."desiredSalary",
  appsub."previousImpactExperience",
  CASE
    appsub."workAuthorization"
    WHEN 'authorized' THEN 'Authorized to work in the U.S.'
    WHEN 'sponsorship' THEN 'Will now or in the future require sponsorship to work in the U.S.'
    ELSE appsub."workAuthorization"
  END "workAuthorization",
  appsub."hoursPerWeek",
  appsub."essayResponse"
FROM
  PUBLIC."ApplicantSubmission" appsub
  LEFT JOIN PUBLIC."Applicant" apl ON appsub."applicantId" = apl.id;