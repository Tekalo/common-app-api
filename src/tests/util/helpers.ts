import { BaseConfig } from '@App/resources/types/shared.js';

/** These are helpers for unit tests as well as integration tests.
 * Functions added here should not rely on integrations or shared context (like prisma)
 * that are not desired in unit tests.
 */

/**
 * Prepend this function to tests that you want to conditionally run
 * Example: itif(1 == 1)('should run test',() => {});
 */
const itif = (condition: boolean) => (condition ? it : it.skip);

const getRandomString = () => Math.random().toString(36).slice(2);

const getMockConfig = (overrides: Partial<BaseConfig> = {}): BaseConfig => ({
  env: '',
  port: 1,
  auth0: {
    api: {
      domain: '',
      clientId: '',
      clientSecret: '',
    },
    express: {
      audience: 'fake-audience',
      issuerBaseURL: 'fake-issuerURL',
      issuer: 'fake-issuer',
      tokenSigningAlg: 'HS256',
      secret: 'fake-secret',
    },
  },
  aws: {
    sesFromAddress: '',
    sesReplyToAddress: '',
    region: '',
  },
  sentryDSN: '',
  uploadBucket: '',
  isLoadTest: false,
  webUrl: '',
  ...overrides,
});

export { itif, getRandomString, getMockConfig };
