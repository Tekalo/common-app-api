import { expect, jest, test } from '@jest/globals';
import configLoader from '@App/services/configLoader.js';

describe('Config Loader', () => {
  const { env } = process;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  test('should throw config error for missing AUTH0_CONFIG', () => {
    delete process.env.AUTH0_CONFIG;
    expect(() => {
      configLoader.loadConfig();
    }).toThrow(Error);
  });
});
