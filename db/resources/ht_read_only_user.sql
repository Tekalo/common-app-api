-- Note: Password is in AWS Secrets Manager

CREATE ROLE ht_read_only NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'xxxxx';
GRANT USAGE ON SCHEMA public TO ht_read_only;
GRANT SELECT ON TABLE public."Applicant" TO ht_read_only;
GRANT SELECT ON TABLE public."ApplicantDeletionRequests" TO ht_read_only;
GRANT SELECT ON TABLE public."ApplicantSubmission" TO ht_read_only;
GRANT SELECT ON TABLE public."OpportunityBatch" TO ht_read_only;
GRANT SELECT ON TABLE public."OpportunitySubmission" TO ht_read_only;
