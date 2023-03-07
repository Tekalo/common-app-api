import CAPPError from '@App/resources/shared/CAPPError.js';
import { Auth0Config } from '@App/resources/types/auth0Types.js';
import { Auth0Config as Auth0ConfigSchema } from '@App/resources/zodSchemas/auth0Schemas.js';

// TODO: Move me to /types directory
export type BaseConfig = {
  port: number;
  auth0: Auth0Config
};
function loadConfig(): BaseConfig {
  if (!process.env.AUTH0_CONFIG) {
    throw new CAPPError({
      title: 'Invalid Config',
      detail: 'Missing AUTH0_CONFIG',
    });
  }
  const validateAuth0Config = Auth0ConfigSchema.parse(JSON.parse(process.env.AUTH0_CONFIG));
  const configObj = {
    port: Number(process.env.PORT) || 3000,
    auth0: validateAuth0Config,
  };
  return configObj;
}

export default {
  loadConfig,
};
