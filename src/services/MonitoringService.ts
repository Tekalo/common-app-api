import { Application } from 'express';
import * as Sentry from '@sentry/node';
import { ErrorEvent, TransactionEvent, Transport } from '@sentry/types';
import logger from '@App/services/logger.js';
import { prisma } from '@App/resources/client.js';
import configLoader from './configLoader.js';

class MonitoringService {
  private sentryTransport?: () => Transport;

  private sampleRate;

  private tracesSampleRate;

  private sentryErrorHandler = Sentry.Handlers.errorHandler();

  constructor(sentryTransport?: () => Transport, tracesSampleRate?: number) {
    if (sentryTransport) {
      this.sentryTransport = sentryTransport;
    }
    // error sample rate: set a low error sample rate for load test
    this.sampleRate = 1.0;
    // performance sample rate
    this.tracesSampleRate = tracesSampleRate || 0.25;
  }

  sentryInit(app: Application) {
    /**
     * Initialize Sentry
     */
    const {
      env,
      sentryDSN,
      isLoadTest,
    }: { env: string; sentryDSN: string; isLoadTest: boolean } =
      configLoader.loadConfig();

    const options: Sentry.NodeOptions = {
      dsn: sentryDSN,
      environment: env,
      integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // enable Express.js middleware tracing
        new Sentry.Integrations.Express({ app }),
        // Automatically instrument Node.js libraries and frameworks
        ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
        // enable Prisma tracing
        new Sentry.Integrations.Prisma({ client: prisma }),
      ],
      beforeSend: (event: ErrorEvent) => {
        // don't send health check errors to Sentry
        // we are going to monitor this in CloudWatch instead
        if (event.transaction === 'GET /health') {
          return null;
        }
        return event;
      },
      beforeSendTransaction: (event: TransactionEvent) => {
        // don't send traces of requests to the health check endpoint
        if (event.transaction === 'GET /health') {
          return null;
        }
        return event;
      },
      sampleRate: isLoadTest ? 0.1 : this.sampleRate,
      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: isLoadTest ? 0.1 : this.tracesSampleRate,
      // turning this off because it causes the RequestHandler to hang when tests are run.
      autoSessionTracking: false,

      // optionally include overriden Transport in options for testing
      ...(this.sentryTransport && { transport: this.sentryTransport }),
    };

    Sentry.init(options);

    // RequestHandler creates a separate execution context using domains, so that every
    // transaction/span/breadcrumb is attached to its own Hub instance
    app.use(Sentry.Handlers.requestHandler());
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());
  }

  addSentryErrorHandler(app: Application) {
    app.use(this.sentryErrorHandler);
  }

  static async exitHandler() {
    // eslint-disable-next-line no-console
    logger.info('Shutting down Sentry');
    await Sentry.close(500);
  }

  // All thrown errors should be sent to sentry by default. Use this to log errors that don't throw
  static logError(event: Sentry.Event) {
    Sentry.captureException(event);
  }
}

export default MonitoringService;
