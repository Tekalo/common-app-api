import express, { Application } from 'express';
import * as swaggerUi from 'swagger-ui-express';
import spec from '@App/resources/spec.json' assert { type: 'json' };
import { auth } from 'express-oauth2-jwt-bearer';
import {
  applicantRoutes,
  healthRoutes,
  opportunitiesRoutes,
} from '@App/routes/index.js';
import errorHandler from './middleware/ErrorHandler.js';
import AuthService from './services/AuthService.js';
import MonitoringService from './services/MonitoringService.js';
import configLoader from './services/configLoader.js';

const getApp = (
  authService: AuthService,
  monitoringService: MonitoringService,
): Application => {
  const app: Application = express();

  monitoringService.sentryInit(app);

  const router = express.Router();
  app.use(express.json());
  /**
   * Sets the app to use router and auth
   */
  app.use(router);

  // TODO - move this to per-route but why the FK does this throw a 500?!?!?
  app.use(
    auth({
      issuerBaseURL: 'htps://sf-capp-dev.us.auth0.comt',
      audience: 'https://capp-auth.dev.apps.futurestech.cloud',
    }),
  );

  app.use('/applicants', applicantRoutes(authService));
  app.use('/opportunities', opportunitiesRoutes());
  app.use('/health', healthRoutes());
  /**
   * Swagger UI documentation endpoint
   */
  router.use('/docs', swaggerUi.serve);
  router.get('/docs', swaggerUi.setup(spec));

  router.get('/health', healthRoutes());

  // for testing error capturing in Sentry
  router.get('/debug-sentry', () => {
    throw new Error('Debug Sentry error!');
  });

  // The error handler must be before any other error middleware and after all controllers
  MonitoringService.addSentryErrorHandler(app);

  app.use(errorHandler);
  app.set('port', process.env.PORT);
  return app;
};

export default getApp;
