import { OpportunityBatchRequestBody } from '@App/resources/types/opportunities.js';
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
  test('Should create a new batch of opportunities', async () => {
    const opportunityController = new OpportunityController(ctx.prisma);
    const reqPayload: OpportunityBatchRequestBody = {
      organization: {
        name: 'Bobs Burgers Foundation',
        type: 'nonprofit',
        size: '<50',
        impactAreas: ['Clean Energy'],
        eoe: true,
      },
      contact: {
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        phone: '4258287733',
      },
      submissions: [
        {
          fullyRemote: false,
          roleType: 'Flipper',
          positionTitle: 'Line Cook 1',
          hoursPerWeek: '30/week',
          location: 'Burgerville',
          paid: true,
          pitchEssay: 'Come flip burgers for Bob',
          source: 'Commercial',
          employmentType: 'volunteer',
        },
      ],
    };
    const { organization, contact } = reqPayload;
    const mockResolved = {
      id: 1,
      orgName: organization.name,
      orgType: organization.type,
      orgSize: organization.size,
      impactAreas: organization.impactAreas,
      contactName: contact.name,
      contactPhone: contact.phone,
      contactEmail: contact.email,
      equalOpportunityEmployer: organization.eoe,
    };
    mockCtx.prisma.opportunityBatch.create.mockResolvedValue(mockResolved);
    const response = await opportunityController.createOpportunityBatch(
      reqPayload,
    );
    expect(response).toEqual(mockResolved);
  });
  test('Should return error when Prisma throws an invalid input error', async () => {
    mockCtx.prisma.opportunityBatch.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('ERROR', {
        code: '101',
        clientVersion: '1.0',
      }),
    );
    const opportunityController = new OpportunityController(ctx.prisma);
    const reqPayload: OpportunityBatchRequestBody = {
      organization: {
        name: 'Bobs Burgers Foundation',
        type: 'nonprofit',
        size: '<50',
        impactAreas: ['Clean Energy'],
        eoe: false,
      },
      contact: {
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        phone: '4258287733',
      },
      submissions: [
        {
          fullyRemote: true,
          roleType: 'A guy',
          positionTitle: 'That Dude',
          hoursPerWeek: '20/week',
          location: 'Burgerville',
          paid: true,
          pitchEssay: 'Come flip burgers for Bob',
          source: 'Commercial',
          employmentType: 'consultant',
        },
      ],
    };
    await expect(
      opportunityController.createOpportunityBatch(reqPayload),
    ).rejects.toHaveProperty(
      'problem.detail',
      'Database error encountered when creating new opportunity batch',
    );
  });
});
