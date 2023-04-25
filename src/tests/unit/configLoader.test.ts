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
  test('should throw config error for missing AWS_ACCESS_KEY_ID', () => {
    delete process.env.AWS_CONFIG;
    expect(() => {
      configLoader.loadConfig();
    }).toThrow(Error);
  });
  test('should set load test to false if env value is false', () => {
    process.env.LOAD_TEST = 'false';
    const { isLoadTest }: { isLoadTest: boolean } = configLoader.loadConfig();

    expect(isLoadTest).toBe(false);
  });
  test('should set load test to false by default', () => {
    delete process.env.LOAD_TEST;
    const { isLoadTest }: { isLoadTest: boolean } = configLoader.loadConfig();

    expect(isLoadTest).toBe(false);
  });
});
