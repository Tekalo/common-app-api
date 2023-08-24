import { PrismaClient } from '@prisma/client';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';

const prisma = new PrismaClient();
const sessionStore = new PrismaSessionStore(prisma, {
  checkPeriod: 2 * 60 * 1000, // 2 minutes
});

process.on('beforeExit', (): void => {
  // eslint-disable-next-line no-void
  void (async () => {
    await sessionStore.shutdown();
  })();
});

export { prisma, sessionStore };
