import { z } from 'zod';
import auth0 from './auth0.js';

const BaseConfigSchema = z.object({
  env: z.string(),
  port: z.number(),
  auth0: z.object({
    api: auth0.Auth0ApiConfigSchema,
    express: auth0.Auth0ExpressConfigSchema,
  }),
  aws: z.object({
    sesFromAddress: z.string(),
    sesReplyToAddress: z.string(),
    region: z.string(),
  }),
  sentryDSN: z.string(),
  uploadBucket: z.string(),
  isLoadTest: z.boolean(),
  webUrl: z.string(),
});

export default BaseConfigSchema;
