import CAPPError from '@App/resources/shared/CAPPError.js';
import {
  Auth0ApiConfig,
  Auth0ExpressConfig,
} from '@App/resources/types/auth0.js';
import {
  Auth0ApiConfigSchema,
  Auth0ExpressConfigSchema,
} from '@App/resources/schemas/auth0.js';

export type BaseConfig = {
  env: string;
  port: number;
  auth0: {
    api: Auth0ApiConfig;
    express: Auth0ExpressConfig;
  };
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    sesFromAddress: string;
  };
  sentryDSN: string;
  isLoadTest: boolean;
};

function loadConfig(): BaseConfig {
  if (!process.env.AUTH0_EXPRESS_CONFIG) {
    throw new CAPPError({
      title: 'Invalid Config',
      detail: 'Missing AUTH0_CONFIG',
    });
  }
  if (!process.env.AUTH0_API_CONFIG) {
    throw new CAPPError({
      title: 'Invalid Config',
      detail: 'Missing AUTH0_API_CONFIG',
    });
  }

  if (
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY ||
    !process.env.AWS_SESSION_TOKEN ||
    !process.env.AWS_SES_FROM_ADDRESS
  ) {
    throw new CAPPError({
      title: 'Invalid Config',
      detail: 'Missing AWS config value',
    });
  }

  const validatedAuth0ApiConfig = Auth0ApiConfigSchema.parse(
    JSON.parse(process.env.AUTH0_API_CONFIG),
  );
  const validatedExpressAuth0Config = Auth0ExpressConfigSchema.parse(
    JSON.parse(process.env.AUTH0_EXPRESS_CONFIG),
  );

  const configObj = {
    env: process.env.APP_ENV || 'dev',
    port: Number(process.env.PORT) || 3000,
    auth0: {
      api: validatedAuth0ApiConfig,
      express: validatedExpressAuth0Config,
    },
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
      sesFromAddress: process.env.AWS_SES_FROM_ADDRESS,
    },
    sentryDSN: process.env.SENTRY_DSN || '',
    isLoadTest: Boolean(process.env.LOAD_TEST) || false,
  };
  return configObj;
}

export default { loadConfig };
