import express, { Application } from 'express';
import * as Sentry from '@sentry/node';
import * as swaggerUi from 'swagger-ui-express';
import spec from '@App/resources/spec.json' assert { type: 'json' };
import {
  applicantRoutes,
  healthRoutes,
  opportunitiesRoutes,
} from '@App/routes/index.js';
import errorHandler from './middleware/ErrorHandler.js';
import AuthService from './services/AuthService.js';

const getApp = (authService: AuthService): Application => {
  const app: Application = express();

  /**
   * Initialize Sentry
   */
  Sentry.init({
    dsn: 'https://c38ab9f98fd0404f9d2bfb95d015da8d@o4504962952724480.ingest.sentry.io/4504963428777984',
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),
      // Automatically instrument Node.js libraries and frameworks
      ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });

  // // RequestHandler creates a separate execution context using domains, so that every
  // // transaction/span/breadcrumb is attached to its own Hub instance
  // app.use(Sentry.Handlers.requestHandler());
  // // TracingHandler creates a trace for every incoming request
  // app.use(Sentry.Handlers.tracingHandler());

  const router = express.Router();
  app.use(express.json());
  /**
   * Sets the app to use router and auth
   */
  app.use(router);
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
  // app.use(Sentry.Handlers.errorHandler());

  app.use(errorHandler);
  app.set('port', process.env.PORT);
  return app;
};

export default getApp;
