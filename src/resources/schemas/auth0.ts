import { z } from 'zod';

/**
 * Zod schemas for Auth0 Management API
 */
const ShellUserPayloadSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  connection: z.string(),
});

const Auth0ConfigSchema = z.object({
  domain: z.string(),
  clientId: z.string(),
  clientSecret: z.string(),
});

export { ShellUserPayloadSchema, Auth0ConfigSchema };
