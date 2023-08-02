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
  ARRAY_CAT(
    appsub."interestCauses",
    LOWER(appsub."otherCauses" :: TEXT) :: TEXT []
  ) AS "allCauses",
  ARRAY_CAT(
    appsub.skills,
    LOWER(appsub."otherSkills" :: TEXT) :: TEXT []
  ) AS "allSkills",
  appsub."currentLocation",
  appsub."openToRelocate",
  COALESCE(
    appsub."openToRemoteMulti",
    string_to_array(appsub."openToRemote", '')
  ) AS "openToRemote",
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
    WHEN appsub."referenceAttribution" IS NULL THEN appsub."referenceAttributionOther"
    WHEN appsub."referenceAttributionOther" IS NULL THEN appsub."referenceAttribution"
    ELSE appsub."referenceAttribution" || ' - ' || appsub."referenceAttributionOther"
  END AS "referenceAttributionAll",
  appsub."interestWorkArrangement"
FROM
  PUBLIC."ApplicantSubmission" appsub
  LEFT JOIN PUBLIC."Applicant" apl ON appsub."applicantId" = apl.id
WHERE
  apl.email NOT LIKE 'test-user-%@schmidtfutures.com';