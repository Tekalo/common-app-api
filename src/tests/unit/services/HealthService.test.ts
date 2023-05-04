import HealthService, { ResourceHealth } from '@App/services/HealthService.js';
import {
  MockContext,
  Context,
  createMockContext,
} from '@App/tests/util/context.js';

let mockCtx: MockContext;
let ctx: Context;

beforeEach(() => {
  mockCtx = createMockContext();
  ctx = mockCtx as unknown as Context;
});

describe('HealthService', () => {
  test('should return healthy value if health checks pass', async () => {
    mockCtx.prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    const healthService = new HealthService(ctx.prisma);
    const result = await healthService.getHealth();
    expect(result.status).toBe(ResourceHealth.Healthy);
  });

  test('should return unhealthy value if there is a problem with the database connection', async () => {
    mockCtx.prisma.$queryRaw.mockImplementation(() => {
      throw new Error('Database connection error.');
    });
    const healthService = new HealthService(ctx.prisma);
    const result = await healthService.getHealth();
    expect(result.status).toBe(ResourceHealth.Unhealthy);
  });
});
