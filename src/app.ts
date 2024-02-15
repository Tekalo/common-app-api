import spec from '@App/resources/spec/spec.json' assert { type: 'json' };
import {
  applicantRoutes,
  healthRoutes,
  opportunitiesRoutes,
  skillsRoutes,
  causesRoutes,
  cleanupRoutes,
} from '@App/routes/index.js';
import logger from '@App/services/logger.js';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { randomUUID } from 'crypto';
import express, { Application, Handler, NextFunction, Response } from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import session from 'express-session';
import { pinoHttp } from 'pino-http';
import * as swaggerUi from 'swagger-ui-express';
import errorHandler from './middleware/errorHandler.js';
import { prisma } from './resources/client.js';
import { AuthRequest } from './resources/types/auth0.js';
import { BaseConfig } from './resources/types/shared.js';
import AuthService from './services/AuthService.js';
import EmailService from './services/EmailService.js';
import MonitoringService from './services/MonitoringService.js';
import UploadService from './services/UploadService.js';

const getApp = (
  authService: AuthService,
  monitoringService: MonitoringService,
  emailService: EmailService,
  uploadService: UploadService,
  config: BaseConfig,
): Application => {
  const app: Application = express();
  logger.info({ github_sha: config.github_sha }, 'Booting application');

  monitoringService.sentryInit(app);

  // TODO: can we do this somewhere else?
  config.auth0.express.cacheMaxAge = 12 * 60 * 60 * 1000; // 12 hours
  const authenticator = new Authenticator(prisma, config);

  const router = express.Router();

  app.use(
    pinoHttp({
      logger,
      // Define a custom request id function
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      genReqId: (req, _res) => {
        if (req.id) return req.id;
        const id = randomUUID();
        return id;
      },
    }),
  );

  app.use(express.json());
  // mount health check early
  app.use('/health', healthRoutes());

  causesRoutes(config, '/causes').mountPublicCausesRoutes(app);
  const { mountPublicSkillsRoutes, mountAuthenticatedSkillsRoutes } = skillsRoutes(config, '/skills');
  mountPublicSkillsRoutes(app);

  /**
   * Setup cookie session middleware
   * for authenticating new applicants who have not yet created an account
   */
  const { clientSecret } = config.auth0.api;
  app.use(
    session({
      store: new PrismaSessionStore(prisma, {
        checkPeriod: process.env.NODE_ENV === 'test' ? 0 : 2 * 60 * 1000, // 2 minutes in non-test envs
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

  const authWrapper =
    (authMiddleware: Handler) =>
    (req: AuthRequest, res: Response, next: NextFunction) =>
      authMiddleware(req, res, (err) => {
        if (err && err instanceof Error) {
          // Attach any error for further processing in Authenticator.ts (eg. 401 Unauthorized or anything else)
          req.authError = err;
        }
        next();
      });
  // JWT not required by default. Use middleware in Authenticator.ts to require JWT.
  app.use(authWrapper(auth({ ...config.auth0.express })));

  app.use(
    '/applicants',
    applicantRoutes(authService, emailService, uploadService, config, authenticator),
  );
  app.use('/opportunities', opportunitiesRoutes(emailService, config));
  mountAuthenticatedSkillsRoutes(app, authenticator);
  app.use(
    '/cleanup',
    cleanupRoutes(authService, emailService, uploadService, config),
  );

  /**
   * Swagger UI documentation endpoint
   * Turned off in production
   */
  if (config.env !== 'prod') {
    router.use('/docs', swaggerUi.serve);
    router.get('/docs', swaggerUi.setup(spec));
  }

  // The error handler must be before any other error middleware and after all controllers
  monitoringService.addSentryErrorHandler(app);

  app.use(errorHandler);
  app.set('port', config.port);

  return app;
};

export default getApp;
