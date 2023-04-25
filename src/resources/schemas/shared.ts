import { z } from 'zod';
import { Auth0ApiConfigSchema, Auth0ExpressConfigSchema } from './auth0.js';

const BaseConfigSchema = z.object({
  env: z.string(),
  port: z.number(),
  auth0: z.object({
    api: Auth0ApiConfigSchema,
    express: Auth0ExpressConfigSchema,
  }),
  sesFromAddress: z.string(),
  sentryDSN: z.string(),
  isLoadTest: z.boolean(),
  webUrl: z.string(),
});

export default BaseConfigSchema;
