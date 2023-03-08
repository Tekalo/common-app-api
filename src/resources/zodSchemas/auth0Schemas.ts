import { z } from 'zod';

/**
 * Zod schemas for Auth0 Management API
 */
const ShellUserPayload = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  connection: z.string(),
});

const Auth0Config = z.object({
  domain: z.string(),
  clientId: z.string(),
  clientSecret: z.string(),
});

export { ShellUserPayload, Auth0Config };
