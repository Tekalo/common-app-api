import { pino } from 'pino';

const logger = pino({
  formatters: {
    level(level) {
      return { level };
    },
  },
  // Suppress logs during testing since it's noisy
  // Ideal would be to find a mechanism to grab the logs and only display them if a test fails
  enabled: process.env.NODE_ENV !== 'test',
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    // Suppress the authorization header which contains the bearer token
    paths: ['req.headers.authorization'],
  },
});

export default logger;
