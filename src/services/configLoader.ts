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
  sentryDSN: string;
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
    sentryDSN: process.env.SENTRY_DSN || '',
  };
  return configObj;
}

export default {
  loadConfig,
};
