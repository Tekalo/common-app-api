import { BaseConfigSchema } from '@App/resources/schemas/shared.js';
import {
  Auth0ApiConfig,
  Auth0ExpressConfig,
} from '@App/resources/types/auth0.js';
import { AWSConfig, BaseConfig } from '@App/resources/types/shared.js';

function loadConfig(): BaseConfig {
  const validatedConfig = BaseConfigSchema.parse({
    env: process.env.APP_ENV || 'dev',
    port: Number(process.env.PORT) || 3000,
    auth0: {
      api: JSON.parse(String(process.env.AUTH0_API_CONFIG)) as Auth0ApiConfig,
      express: JSON.parse(
        String(process.env.AUTH0_EXPRESS_CONFIG),
      ) as Auth0ExpressConfig,
    },
    aws: JSON.parse(String(process.env.AWS_CONFIG)) as AWSConfig,
    sentryDSN: process.env.SENTRY_DSN || '',
    isLoadTest: Boolean(process.env.LOAD_TEST) || false,
    webUrl: process.env.WEB_URL || '',
  });
  return validatedConfig;
}

export default { loadConfig };
