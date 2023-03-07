import { z } from 'zod';

/**
 * Zod schemas for Common-App-API request params
 */
const ApplicantResponseSchema = z.object({
  auth0Id: z.string().optional(),
  email: z.string(),
});

export default ApplicantResponseSchema;
