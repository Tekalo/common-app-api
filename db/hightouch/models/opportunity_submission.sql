SELECT
  ob."contactEmail",
  ob."contactName",
  ob."contactPhone",
  ARRAY_CAT(
    ob."impactAreas",
    LOWER(ob."impactAreasOther" :: TEXT) :: TEXT []
  ) AS "impactAreasAll",
  ob."orgName",
  ob."orgSize",
  ob."orgType",
  ob."equalOpportunityEmployer",
  CASE
    WHEN (
      ob."referenceAttribution" = ''
      OR ob."referenceAttribution" IS NULL
    ) THEN ob."referenceAttributionOther"
    WHEN (
      ob."referenceAttributionOther" = ''
      OR ob."referenceAttributionOther" IS NULL
    ) THEN ob."referenceAttribution"
    ELSE ob."referenceAttribution" || ' - ' || ob."referenceAttributionOther"
  END AS "referenceAttributionAll",
  ob."orgName" || ' - ' || os."positionTitle" AS "opportunityName",
  os.id,
  os."opportunityBatchId",
  os."createdAt",
  os."source",
  os."employmentType",
  CASE
    WHEN os.paid THEN 'Paid'
    ELSE 'Unpaid'
  END AS "paymentStatus",
  CASE
    WHEN os."roleType" = '' THEN os."otherRoleType"
    WHEN (
      os."otherRoleType" = ''
      OR os."otherRoleType" IS NULL
    ) THEN os."roleType"
    ELSE os."roleType" || ' - ' || os."otherRoleType"
  END AS "roleType",
  os."salaryRange",
  os."positionTitle",
  os."fullyRemote",
  os."location",
  CASE
    os."visaSponsorship"
    WHEN 'yes' THEN 'Sponsors U.S. Visas'
    WHEN 'no' THEN 'Does not sponsor U.S. Visas'
    WHEN 'sometimes' THEN 'Sponsors U.S. Visas in some cases'
    ELSE os."visaSponsorship"
  END "visaSponsorship",
  os."desiredHoursPerWeek",
  os."desiredStartDate",
  os."desiredEndDate",
  os."desiredYoe",
  (
    SELECT
      ARRAY_AGG(COALESCE(sv.canonical, x)) FILTER (
        WHERE
          sv."rejectAs" IS NULL
      )
    FROM
      UNNEST(os."desiredSkills") AS x
      LEFT JOIN PUBLIC."SkillsView" sv ON x = sv.name
  ) AS "desiredAllSkills",
  os."desiredImpactExp",
  os."similarStaffed",
  os."jdUrl",
  os."pitchEssay"
FROM
  "OpportunitySubmission" os
  LEFT JOIN "OpportunityBatch" ob ON os."opportunityBatchId" = ob.id
WHERE
  ob."contactEmail" != 'success+test-user-contact@simulator.amazonses.com';