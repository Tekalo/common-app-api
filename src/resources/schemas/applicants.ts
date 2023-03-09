import { z } from 'zod';

const PreferredContact = z.enum(['sms', 'whatsapp', 'email']);

/**
 * Zod schemas for Common-App-API request bodies
 */
const ApplicantRequestBodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
  preferredContact: PreferredContact,
});

const ApplicantResponseBodySchema = z.object({
  id: z.number(),
  auth0Id: z.string().nullable(),
  email: z.string(),
});

const ApplicantQueryParamsSchema = z.object({
  auth0: z
    .string()
    .optional()
    .refine((val) => val === undefined || val === 'true' || val === 'false'),
});

export {
  ApplicantRequestBodySchema,
  ApplicantResponseBodySchema,
  ApplicantQueryParamsSchema,
};
