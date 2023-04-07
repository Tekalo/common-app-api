import getApp from '@App/app.js';
import AuthService from './services/AuthService.js';
import MonitoringService from './services/MonitoringService.js';

const app = getApp(new AuthService(), new MonitoringService());

const port = +app.get('port');

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`server running at http://localhost:${port}`);
});

// https://github.com/getsentry/sentry-javascript/issues/6750
// https://stackoverflow.com/questions/49417580/express-middleware-cannot-trap-errors-thrown-by-async-await-but-why/49417798#49417798
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled', reason, p); // log all your errors, "unsuppressing" them.
});
