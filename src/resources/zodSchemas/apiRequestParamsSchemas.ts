import { z } from 'zod';

/**
 * Zod schemas for CommonApp-API request params
 */
const ApplicantQueryParamsSchema = z.object({
  auth0: z
    .string()
    .optional()
    .refine((val) => val === undefined || val === 'true' || val === 'false'),
});

export default ApplicantQueryParamsSchema;
