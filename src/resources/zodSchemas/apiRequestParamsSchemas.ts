import { z } from 'zod';

/**
 * Zod schemas for Common-App-API request params
 */
const ApplicantQueryParamsSchema = z.object({
  auth0: z.string(),
});

export default ApplicantQueryParamsSchema;