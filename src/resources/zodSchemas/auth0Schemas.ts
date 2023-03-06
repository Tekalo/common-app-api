import { z } from 'zod';

/**
 * Zod schemas for Auth0 Management API
 */
const UserPayload = z.object({ // todo rename to SHELL user payload
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  connection: z.string(),
});

const Auth0Config = z.object({
  domain: z.string(),
  clientId: z.string().email(),
  clientSecret: z.string(),
});

export { UserPayload, Auth0Config }
