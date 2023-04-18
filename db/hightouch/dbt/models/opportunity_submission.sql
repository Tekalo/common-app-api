SELECT
  ob."contactEmail",
  ob."contactName",
  ob."contactPhone",
  ob."impactAreas",
  ob."orgName",
  ob."orgSize",
  ob."orgType",
  ob."equalOpportunityEmployer",
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
  os."roleType",
  os."salaryRange",
  os."positionTitle",
  os."fullyRemote",
  os."location",
  os."visaSponsorship",
  os."desiredHoursPerWeek",
  os."desiredStartDate",
  os."desiredEndDate",
  os."desiredYoe",
  ARRAY_CAT(os."desiredSkills", os."desiredSkillsOther") AS "desiredSkillsAll",
  os."desiredImpactExp",
  os."similarStaffed",
  os."jdUrl",
  os."pitchEssay"
FROM
  {{ source("capp_sources", "OpportunitySubmission") }} os
  LEFT JOIN {{ source("capp_sources", "OpportunityBatch") }} ob ON os."opportunityBatchId" = ob.id;