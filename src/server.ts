import getApp from '@App/app.js';
import AuthService from './services/AuthService.js';
import configLoader from './services/configLoader.js';
import MonitoringService from './services/MonitoringService.js';

const app = getApp(
  new AuthService(),
  new MonitoringService(),
  configLoader.loadConfig(),
);

const port = +app.get('port');

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`server running at http://localhost:${port}`);
});
