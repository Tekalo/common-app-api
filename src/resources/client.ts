import { PrismaClient } from '@prisma/client';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import logger from '@App/services/logger.js';

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'error',
    },
  ],
});

prisma.$on('error', (err) => {
  if (
    err.message
      .replaceAll(/`.*?`/g, '')
      .includes(
        'Authentication failed against database server at , the provided database credentials for  are not valid.',
      )
  ) {
    logger.error('Password auth failed; shutting down');
    process.kill(process.pid, 'SIGTERM');
  }
});

const sessionStore = new PrismaSessionStore(prisma, {
  checkPeriod: 2 * 60 * 1000, // 2 minutes
});

export { prisma, sessionStore };
