import { z } from 'zod';
import { Auth0ApiConfigSchema, Auth0ExpressConfigSchema } from './auth0.js';

const AWSConfigSchema = z.object({
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  sesFromAddress: z.string(),
});

const BaseConfigSchema = z.object({
  env: z.string(),
  port: z.number(),
  auth0: z.object({
    api: Auth0ApiConfigSchema,
    express: Auth0ExpressConfigSchema,
  }),
  aws: AWSConfigSchema,
  sentryDSN: z.string(),
  isLoadTest: z.boolean(),
  webUrl: z.string(),
});

export { BaseConfigSchema, AWSConfigSchema };
