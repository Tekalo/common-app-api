import { z } from 'zod';

/**
 * Zod schemas for Auth0 Management API
 */
const UserPayload = z.object({
  name: z.string(),
  email: z.string().email(),
  connection: z.string(),
});

export default UserPayload;
