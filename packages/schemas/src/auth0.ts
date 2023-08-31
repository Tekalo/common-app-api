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

const Auth0ApiConfigSchema = z.object({
  domain: z.string(),
  clientId: z.string(),
  clientSecret: z.string(),
});

const Auth0ExpressConfigSchema = z.object({
  audience: z.string(),
  issuerBaseURL: z.string().optional(),
  issuer: z.string().optional(),
  tokenSigningAlg: z.string().optional(),
  secret: z.string().optional(),
  cacheMaxAge: z.number().optional(),
});

export default {
  ShellUserPayloadSchema,
  Auth0ApiConfigSchema,
  Auth0ExpressConfigSchema,
};
