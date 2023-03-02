// TODO: Move me to /types directory
export type BaseConfig = {
  port: number;
  auth0: Record<string, never>;
};
function loadConfig(): BaseConfig {
  if (process.env.AUTH0_CONFIG === undefined) {
    throw new Error('Missing AUTH0_CONFIG environment variable');
  }
  const configObj = {
    port: Number(process.env.PORT) || 3000,
    auth0: {},
  };
  return configObj;
}

export default {
  loadConfig,
};
