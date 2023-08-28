import { PrismaClient } from '@prisma/client';

export enum ResourceHealth {
  Healthy = 'HEALTHY',
  Unhealthy = 'UNHEALTHY',
}

export default class HealthService {
  private prisma: PrismaClient;

  public overallHealth: ResourceHealth = ResourceHealth.Healthy;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getHealth(): Promise<HealthCheckResult> {
    try {
      // TODO: remove before merge -- this is being used for testing locally
      await this.prisma.$disconnect();
      const result: number[] = await this.prisma.$queryRaw<number[]>`SELECT 1`;
      this.overallHealth =
        result?.length === 1
          ? ResourceHealth.Healthy
          : ResourceHealth.Unhealthy;
    } catch (err) {
      this.overallHealth = ResourceHealth.Unhealthy;
    }

    return {
      status: this.overallHealth,
    };
  }
}

type HealthCheckResult = {
  status: ResourceHealth;
};
