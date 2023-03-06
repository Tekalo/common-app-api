import { Auth0Config } from "@App/resources/types/auth0Types.js";
import { Auth0Config as Auth0ConfigSchema } from "@App/resources/zodSchemas/auth0Schemas.js";
import { z } from "zod";

// TODO: Move me to /types directory
export type BaseConfig = {
  port: number;
  auth0: Auth0Config
};
function loadConfig(): BaseConfig {
  Auth0ConfigSchema.parse(process.env.AUTH0_CONFIG)
  const configObj = {
    port: Number(process.env.PORT) || 3000,
    auth0: {
      name: process
    },
  };
  return configObj;
}

export default {
  loadConfig,
};
