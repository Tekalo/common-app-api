import { Application } from 'express';
import getApp from '@App/app.js';
import { BaseConfig } from '@App/resources/types/shared.js';
import configLoader from '@App/services/configLoader.js';
import DummyAuthService from './DummyAuthService.js';
import DummyEmailService from './DummyEmailService.js';
import DummyMonitoringService from './DummyMonitoringService.js';
import DummySESService from './DummySesService.js';

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
  isLoadTest: false,
  webUrl: '',
  ...overrides,
});

const getDummyApp = (
  dummyAuthService?: DummyAuthService,
  dummyMonitoringService?: DummyMonitoringService,
  dummyEmailService?: DummyEmailService,
  mockConfig?: BaseConfig,
): Application => {
  const appConfig = configLoader.loadConfig();
  return getApp(
    dummyAuthService || new DummyAuthService(),
    dummyMonitoringService || new DummyMonitoringService(),
    dummyEmailService ||
      new DummyEmailService(new DummySESService(), appConfig),
    mockConfig || appConfig,
  );
};

export { getMockConfig, getDummyApp };
