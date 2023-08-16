import { config } from 'schemas';
import {
  Auth0ApiConfig,
  Auth0ExpressConfig,
} from '@App/resources/types/auth0.js';
import { BaseConfig } from '@App/resources/types/shared.js';

function loadConfig(): BaseConfig {
  const validatedConfig = config.parse({
    env: process.env.APP_ENV || 'dev',
    port: Number(process.env.PORT) || 3000,
    auth0: {
      api: JSON.parse(String(process.env.AUTH0_API_CONFIG)) as Auth0ApiConfig,
      express: JSON.parse(
        String(process.env.AUTH0_EXPRESS_CONFIG),
      ) as Auth0ExpressConfig,
    },
    aws: {
      sesFromAddress:
        process.env.AWS_SES_FROM_ADDRESS || 'tekalo@dev.apps.futurestech.cloud',
      sesReplyToAddress:
        process.env.AWS_SES_REPLYTO_ADDRESS ||
        'tekalo@dev.apps.futurestech.cloud',
      region: process.env.AWS_REGION || 'us-east-1',
    },
    sentryDSN: process.env.SENTRY_DSN || '',
    isLoadTest: process.env.LOAD_TEST === 'true',
    webUrl: process.env.WEB_URL || '',
    uploadBucket: process.env.UPLOAD_BUCKET || 'capp-dev-api-uploads',
  });
  return validatedConfig;
}

export default { loadConfig };
