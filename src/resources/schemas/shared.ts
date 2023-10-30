import { Auth0 } from '@capp/schemas';
import { z } from 'zod';

const PresignerStrategy = z.enum(['post', 'put', 'both']);

const ConfigSchema = z.object({
  github_sha: z.string().default('UNKNOWN'),
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
    sesWhiteList: z.array(z.string()),
  }),
  sentryDSN: z.string(),
  uploadBucket: z.string(),
  isLoadTest: z.boolean(),
  webUrl: z.string(),
  useEmailWhiteList: z.boolean(),
  flags: z.object({
    /** Which presignature strategy should we allow? put, post, both */
    presignerStrategy: PresignerStrategy.default('put'),
  }),
});

export default ConfigSchema;
