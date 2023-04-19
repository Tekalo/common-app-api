import configLoader from '@App/services/configLoader.js';

describe('Config Loader', () => {
  const { env } = process;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  test('should throw config error for missing AUTH0_EXPRESS_CONFIG', () => {
    delete process.env.AUTH0_EXPRESS_CONFIG;
    expect(() => {
      configLoader.loadConfig();
    }).toThrow(Error);
  });
  test('should throw config error for missing AUTH0_API_CONFIG', () => {
    delete process.env.AUTH0_API_CONFIG;
    expect(() => {
      configLoader.loadConfig();
    }).toThrow(Error);
  });
});
