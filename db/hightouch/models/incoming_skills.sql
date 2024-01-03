/**
 * The hard-coded '2023-12-01' references the day the ReferenceSkills were first loaded into the database
 */
select distinct coalesce(rs.name, as2.name, os.name) as name, COALESCE(LEAST(as2."createdAt", os."createdAt"), '2023-12-01'::date) as "createdAt"
from "ReferenceSkills" rs 
full join "ApplicantSkills" as2 on as2.name = rs.name
full join "OpportunitySkills" os on os.name = rs.name
WHERE coalesce(rs.name, as2.name, os.name) is not null;