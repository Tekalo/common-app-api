import { OpportunityRequestBody } from '@App/resources/types/opportunities.js';
import {
  MockContext,
  Context,
  createMockContext,
} from '@App/tests/util/context.js';
import { Prisma } from '@prisma/client';
import OpportunityController from '@App/controllers/OpportunityController.js';

let mockCtx: MockContext;
let ctx: Context;

beforeEach(() => {
  mockCtx = createMockContext();
  ctx = mockCtx as unknown as Context;
});

export type PrismaCreateInputType = Prisma.ApplicantSelect;

describe('Opportunity Controller', () => {
  test('Should create a new opportunity', async () => {
    const mockResolved = {
      count: 1,
    };
    mockCtx.prisma.opportunitySubmission.createMany.mockResolvedValue(
      mockResolved,
    );
    const opportunityController = new OpportunityController(ctx.prisma);
    const reqPayload: OpportunityRequestBody = [
      {
        organization: {
          name: 'Bobs Burgers Foundation',
          type: 'nonprofit',
          size: '<50',
        },
        contact: {
          name: 'Bob Boberson',
          email: 'bboberson@gmail.com',
          phone: '4258287733',
        },
        fullTime: false,
      },
    ];
    const response = await opportunityController.createOpportunitySubmissions(
      reqPayload,
    );
    expect(response).toEqual({ count: 1 });
  });
  test('Should throw CAPP error when Prisma throws an invalid input error', async () => {
    mockCtx.prisma.opportunitySubmission.createMany.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('ERROR', {
        code: '101',
        clientVersion: '1.0',
      }),
    );
    const opportunityController = new OpportunityController(ctx.prisma);
    const reqPayload: OpportunityRequestBody = [
      {
        organization: {
          name: 'Bobs Burgers Foundation',
          type: 'nonprofit',
          size: '<50',
        },
        contact: {
          name: 'Bob Boberson',
          email: 'bboberson@gmail.com',
          phone: '4258287733',
        },
        fullTime: false,
      },
    ];
    await expect(
      opportunityController.createOpportunitySubmissions(reqPayload),
    ).rejects.toHaveProperty(
      'problem.detail',
      'Database error encountered when creating new opportunity submission',
    );
  });
});
