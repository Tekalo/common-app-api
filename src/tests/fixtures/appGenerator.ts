import { Application } from 'express';
import getApp from '@App/app.js';
import { BaseConfig } from '@App/resources/types/shared.js';
import configLoader from '@App/services/configLoader.js';
import { prisma } from '@App/resources/client.js';
import DummyAuthService from './DummyAuthService.js';
import DummyEmailService from './DummyEmailService.js';
import DummyMonitoringService from './DummyMonitoringService.js';
import DummySESService from './DummySesService.js';
import DummyUploadService from './DummyUploadService.js';
import DummyS3Service from './DummyS3Service.js';

const getDummyApp = (
  dummyAuthService?: DummyAuthService,
  dummyMonitoringService?: DummyMonitoringService,
  dummyEmailService?: DummyEmailService,
  dummyUploadService?: DummyUploadService,
  mockConfig?: BaseConfig,
): Application => {
  const appConfig = configLoader.loadConfig();
  return getApp(
    dummyAuthService || new DummyAuthService(),
    dummyMonitoringService || new DummyMonitoringService(prisma),
    dummyEmailService ||
      new DummyEmailService(new DummySESService(), appConfig),
    dummyUploadService ||
      new DummyUploadService(prisma, new DummyS3Service(), appConfig),
    mockConfig || appConfig,
  );
};

export default getDummyApp;
