import CAPPError from '@App/resources/shared/CAPPError.js';
import { Auth0Config } from '@App/resources/types/auth0.js';
import { Auth0ConfigSchema } from '@App/resources/schemas/auth0.js';

export type BaseConfig = {
  env: string;
  port: number;
  auth0: Auth0Config;
  sentryDSN: string;
  isLoadTest: boolean;
};
function loadConfig(): BaseConfig {
  if (!process.env.AUTH0_CONFIG) {
    throw new CAPPError({
      title: 'Invalid Config',
      detail: 'Missing AUTH0_CONFIG',
    });
  }
  const validatedAuth0Config = Auth0ConfigSchema.parse(
    JSON.parse(process.env.AUTH0_CONFIG),
  );
  const configObj = {
    env: process.env.APP_ENV || 'dev',
    port: Number(process.env.PORT) || 3000,
    auth0: validatedAuth0Config,
    sentryDSN: process.env.SENTRY_DSN || '',
    loadTest: Boolean(process.env.LOAD_TEST) || false,
  };
  return configObj;
}

export default {
  loadConfig,
};
