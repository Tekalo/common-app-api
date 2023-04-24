import express, { Application } from 'express';
import * as swaggerUi from 'swagger-ui-express';
import spec from '@App/resources/spec.json' assert { type: 'json' };
import {
  applicantRoutes,
  healthRoutes,
  opportunitiesRoutes,
} from '@App/routes/index.js';
import session from 'express-session';
import ConnectPg from 'connect-pg-simple';
import errorHandler from './middleware/errorHandler.js';
import AuthService from './services/AuthService.js';
import MonitoringService from './services/MonitoringService.js';
import { BaseConfig } from './resources/types/shared.js';

const getApp = (
  authService: AuthService,
  monitoringService: MonitoringService,
  config: BaseConfig,
): Application => {
  const app: Application = express();

  monitoringService.sentryInit(app);

  const router = express.Router();
  app.use(express.json());

  /**
   * Setup cookie session middleware
   * for authenticating new applicants who have not yet created an account
   */
  const PgClient = ConnectPg(session);
  const { clientSecret } = config.auth0.api;
  app.use(
    session({
      store: new PgClient({
        tableName: 'ApplicantSession',
      }),
      secret: clientSecret,
      resave: false,
      saveUninitialized: true,
      cookie: { httpOnly: true, maxAge: 12 * 60 * 60 * 1000 }, // 12 hours
    }),
  );
  /**
   * Sets the app to use router and auth
   */
  app.use(router);

  app.use('/applicants', applicantRoutes(authService, config));
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
