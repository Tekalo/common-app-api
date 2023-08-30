import getApp from '@App/app.js';
import logger from './services/logger.js';
import AuthService from './services/AuthService.js';
import configLoader from './services/configLoader.js';
import EmailService from './services/EmailService.js';
import MonitoringService from './services/MonitoringService.js';
import SESService from './services/SESService.js';
import DummyAuthService from './tests/fixtures/DummyAuthService.js';
import { prisma } from './resources/client.js';
import S3Service from './services/S3Service.js';
import UploadService from './services/UploadService.js';

const config = configLoader.loadConfig();
const authService = config.isLoadTest
  ? new DummyAuthService()
  : new AuthService();

const app = getApp(
  authService,
  new MonitoringService(prisma),
  new EmailService(new SESService(), config),
  new UploadService(prisma, new S3Service(), config),
  config,
);

const port = +app.get('port');

const server = app.listen(port, () => {
  logger.info(`server running at http://localhost:${port}`);
});

server.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Closing server.');
  server.close();
});
