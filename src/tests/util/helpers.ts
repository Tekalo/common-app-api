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
  github_sha: 'test123',
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
    sesWhiteList: [],
  },
  sentryDSN: '',
  uploadBucket: '',
  isLoadTest: false,
  webUrl: '',
  useEmailWhiteList: false,
  ...overrides,
  // We explicitly merge overides.flags below. This lets us specify flags without having to specify
  // all of them in the overrides.
  flags: {
    presignerStrategy: 'put',
    ...overrides.flags,
  },
});

export { getMockConfig, getRandomString, itif };
