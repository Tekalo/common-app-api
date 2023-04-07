import { Application } from 'express';
import * as Sentry from '@sentry/node';
import { Transport } from '@sentry/types';
import configLoader from './configLoader.js';

class MonitoringService {
  private sentryTransport?: () => Transport;

  constructor(sentryTransport?: () => Transport) {
    if (sentryTransport) {
      this.sentryTransport = sentryTransport;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  sentryInit(app: Application) {
    /**
     * Initialize Sentry
     */
    const { sentryDSN }: { sentryDSN: string } = configLoader.loadConfig();

    const options: Sentry.NodeOptions = {
      dsn: sentryDSN,
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

  // eslint-disable-next-line class-methods-use-this
  addSentryErrorHandler(app: Application) {
    app.use(Sentry.Handlers.errorHandler());
  }
}

export default MonitoringService;
