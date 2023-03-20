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
  test('Should create a new opportunity submission', async () => {
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
        fullTime: true,
        impactArea: ['Clean Energy'],
        location: 'Burgerville',
        paid: true,
        pitchEssay: 'Come flip burgers for Bob',
        source: 'Commercial',
        type: 'nonprofit',
      },
    ];
    const mockResolved = {
      id: 5,
      opportunityBatchId: 5,
      orgName: reqPayload[0].organization.name,
      dateAdded: new Date('2023-03-20T15:20:14.588Z'),
      source: reqPayload[0].source,
      type: reqPayload[0].type,
      orgType: reqPayload[0].organization.type,
      orgSize: reqPayload[0].organization.size,
      impactArea: [],
      contactName: reqPayload[0].contact.name,
      contactEmail: reqPayload[0].contact.email,
      contactPhone: reqPayload[0].contact.phone,
      paid: reqPayload[0].paid,
      fullTime: reqPayload[0].fullTime,
      roleType: null,
      salaryRange: null,
      location: reqPayload[0].location,
      visaSponsorship: null,
      desiredStartDate: null,
      desiredEndDate: null,
      desiredYoe: null,
      desiredSkills: [],
      desiredSkillsOther: [],
      desiredImpactExp: null,
      similarStaffed: null,
      jdUrl: null,
      pitchEssay: reqPayload[0].pitchEssay,
    };
    mockCtx.prisma.opportunitySubmission.create.mockResolvedValue(mockResolved);
    const response = await opportunityController.createOpportunitySubmissions(
      reqPayload,
    );
    expect(response).toEqual([{ id: expect.any(Number) }]);
  });
  test('Should throw CAPP error when Prisma throws an invalid input error', async () => {
    mockCtx.prisma.opportunitySubmission.create.mockRejectedValue(
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
        fullTime: true,
        impactArea: ['Clean Energy'],
        location: 'Burgerville',
        paid: true,
        pitchEssay: 'Come flip burgers for Bob',
        source: 'Commercial',
        type: 'nonprofit',
      },
    ];
    await expect(
      opportunityController.createOpportunitySubmissions(reqPayload),
    ).rejects.toHaveProperty(
      'problem.detail',
      'Database error encountered when creating new opportunity submission',
    );
  }); // make sure this does the promise all cathc
});
