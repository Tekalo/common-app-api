import prisma from '@App/resources/client.js';
import { BaseConfig } from '@App/resources/types/shared.js';
import { Upload } from '@prisma/client';

/**
 * Prepend this function to tests that you want to conditionally run
 * Example: itif(1 == 1)('should run test',() => {});
 */
const itif = (condition: boolean) => (condition ? it : it.skip);

const getRandomString = () => Math.random().toString(36).slice(2);

const seedResumeUpload = async (applicantId: number): Promise<Upload> =>
  prisma.upload.create({
    data: {
      type: 'RESUME',
      status: 'SUCCESS',
      applicantId,
      originalFilename: 'myresume.pdf',
      contentType: 'application/pdf',
    },
  });

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

export { itif, getRandomString, getMockConfig, seedResumeUpload };
