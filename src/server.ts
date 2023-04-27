import getApp from '@App/app.js';
import AuthService from './services/AuthService.js';
import configLoader from './services/configLoader.js';
import EmailService from './services/EmailService.js';
import MonitoringService from './services/MonitoringService.js';
import SESService from './services/SESService.js';
import DummyAuthService from './tests/fixtures/DummyAuthService.js';

const config = configLoader.loadConfig();
const authService = config.isLoadTest
  ? new DummyAuthService()
  : new AuthService();

const app = getApp(
  authService,
  new MonitoringService(),
  new EmailService(new SESService(), config),
  config,
);

const port = +app.get('port');

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`server running at http://localhost:${port}`);
});
