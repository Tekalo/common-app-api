SELECT
  id,
  "applicantId",
  "createdAt",
  email
FROM
  PUBLIC."ApplicantDeletionRequests"
WHERE
  email NOT LIKE 'test-user-%@schmidtfutures.com';