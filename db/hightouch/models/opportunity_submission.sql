SELECT
  ob."contactEmail",
  ob."contactName",
  ob."contactPhone",
  ob."impactAreas",
  ob."orgName",
  ob."orgSize",
  ob."orgType",
  os.*
FROM
  "OpportunitySubmission" os
  LEFT JOIN "OpportunityBatch" ob ON os."opportunityBatchId" = ob.id;