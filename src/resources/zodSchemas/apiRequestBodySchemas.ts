import { z } from 'zod';

/**
 * Zod schemas for Common-App-API request bodies
 */
const ApplicantBodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

export default ApplicantBodySchema;
