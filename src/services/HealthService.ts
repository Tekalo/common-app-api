import prisma from '@App/resources/client.js';

export enum ResourceHealth {
  Healthy = 'HEALTHY',
  Unhealthy = 'UNHEALTHY',
}

export default class HealthService {
  public overallHealth: ResourceHealth = ResourceHealth.Healthy;

  async getHealth(): Promise<HealthCheckResult> {
    const result: number[] = await prisma.$queryRaw<number[]>`SELECT 1`;

    this.overallHealth =
      result.length === 1 ? ResourceHealth.Healthy : ResourceHealth.Unhealthy;

    return {
      status: this.overallHealth,
    };
  }
}

type HealthCheckResult = {
  status: ResourceHealth;
};
