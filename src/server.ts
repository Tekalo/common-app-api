import getApp from '@App/app.js';
import AuthService from './services/AuthService.js';

const app = getApp(new AuthService());

const port = +app.get('port');

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`server running at http://localhost:${port}`);
});
