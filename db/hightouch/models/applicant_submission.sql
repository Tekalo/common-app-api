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
  apl."followUpOptIn",
  appsub.id,
  appsub."applicantId",
  appsub."createdAt",
  appsub."originTag",
  CASE
    WHEN appsub."resumeUploadId" IS NULL THEN appsub."resumeUrl"
    ELSE CONCAT(
      'https://www.tekalo.org/view-resume?applicantId=',
      appsub."applicantId"
    )
  END "resumeUrl",
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
  ARRAY_CAT(
    appsub."interestCauses",
    LOWER(appsub."otherCauses" :: TEXT) :: TEXT []
  ) AS "allCauses",
  (
    SELECT
      ARRAY_AGG(COALESCE(sv.canonical, x)) FILTER (
        WHERE
          sv."rejectAs" IS NULL
      )
    FROM
      UNNEST(appsub.skills) AS x
      LEFT JOIN PUBLIC."SkillsView" sv ON x = sv.name
  ) AS "allSkills",
  appsub."currentLocation",
  appsub."openToRelocate",
  appsub."openToRemoteMulti" AS "openToRemote",
  appsub."desiredSalary",
  appsub."previousImpactExperience",
  CASE
    appsub."workAuthorization"
    WHEN 'authorized' THEN 'Authorized to work in the U.S.'
    WHEN 'sponsorship' THEN 'Will now or in the future require sponsorship to work in the U.S.'
    ELSE appsub."workAuthorization"
  END "workAuthorization",
  appsub."hoursPerWeek",
  appsub."essayResponse",
  CASE
    WHEN (
      appsub."referenceAttribution" = ''
      OR appsub."referenceAttribution" IS NULL
    ) THEN appsub."referenceAttributionOther"
    WHEN (
      appsub."referenceAttributionOther" = ''
      OR appsub."referenceAttributionOther" IS NULL
    ) THEN appsub."referenceAttribution"
    ELSE appsub."referenceAttribution" || ' - ' || appsub."referenceAttributionOther"
  END AS "referenceAttributionAll",
  appsub."interestWorkArrangement",
  appsub."updatedAt"
FROM
  PUBLIC."ApplicantSubmission" appsub
  LEFT JOIN PUBLIC."Applicant" apl ON appsub."applicantId" = apl.id
WHERE
  apl.email NOT LIKE 'success+test-user%@simulator.amazonses.com';