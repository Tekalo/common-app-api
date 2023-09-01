import { Auth0 } from '@capp/schemas';
import { z } from 'zod';

const ConfigSchema = z.object({
  env: z.string(),
  port: z.number(),
  auth0: z.object({
    api: Auth0.Auth0ApiConfigSchema,
    express: Auth0.Auth0ExpressConfigSchema,
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

export default ConfigSchema;
