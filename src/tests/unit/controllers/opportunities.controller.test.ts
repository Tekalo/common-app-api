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
        type: '501(c)(3)',
        size: '20-50',
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
          roleType: 'product designer',
          positionTitle: 'Line Cook 1',
          location: 'Burgerville',
          paid: true,
          pitchEssay: 'Come flip burgers for Bob',
          source: 'Commercial',
          employmentType: 'volunteer',
          salaryRange: '20-30$/hr',
          desiredHoursPerWeek: '40',
          desiredStartDate: new Date('2023-01-01'),
          desiredYoe: ['0-2', '2-4'],
          desiredSkills: ['react', 'sketch'],
          jdUrl: 'comeflipforbob.com/apply',
          desiredOtherSkills: 'really good at flipping burgers',
          visaSponsorship: 'no',
          similarStaffed: true,
          desiredImpactExp:
            'We would love to find someone who has non-profit fast food experience.',
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
      contactPhone: contact.phone || null,
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
        type: 'other',
        size: '500+',
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
          location: 'Burgerville',
          paid: true,
          pitchEssay: 'Come flip burgers for Bob',
          source: 'Commercial',
          employmentType: 'consultant',
          salaryRange: '20-30$/hr',
          desiredHoursPerWeek: '30/week',
          desiredStartDate: new Date('2023-12-01'), // TOOD : zod test for bad date
          desiredEndDate: new Date('2024-12-01'),
          desiredYoe: ['15+'],
          desiredSkills: ['figma', 'project management'],
          desiredOtherSkills:
            'really good at frying fries, specifically of the waffle persuasion',
          jdUrl: 'comeflipforbob.com/apply',
          visaSponsorship: 'no',
          similarStaffed: false,
          desiredImpactExp:
            'A candidate who has experience frying fries in the non-profit space',
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
