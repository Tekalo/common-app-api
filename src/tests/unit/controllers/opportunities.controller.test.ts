import { Prisma } from '@prisma/client';
import { jest } from '@jest/globals';
import { OpportunityBatchRequestBody } from '@App/resources/types/opportunities.js';
import {
  MockContext,
  Context,
  createMockContext,
} from '@App/tests/util/context.js';
import OpportunityController from '@App/controllers/OpportunityController.js';
import EmailService from '@App/services/EmailService.js';
import DummyEmailService from '@App/tests/fixtures/DummyEmailService.js';
import DummySESService from '@App/tests/fixtures/DummySESService.js';
import DummySQSService from '@App/tests/fixtures/DummySQSService.js';
import { getMockConfig } from '../../util/helpers.js';

let mockCtx: MockContext;
let ctx: Context;

beforeEach(() => {
  mockCtx = createMockContext();
  ctx = mockCtx as unknown as Context;
});

export type PrismaCreateInputType = Prisma.ApplicantSelect;

describe('Opportunity Controller', () => {
  test('Should create a new batch of opportunities', async () => {
    const opportunityController = new OpportunityController(
      ctx.prisma,
      new DummyEmailService(
        new DummySESService(),
        new DummySQSService(),
        getMockConfig(),
      ),
    );
    const reqPayload: OpportunityBatchRequestBody = {
      acceptedPrivacy: true,
      referenceAttribution: 'linkedin',
      organization: {
        name: 'Bobs Burgers Foundation',
        type: '501(c)(3)',
        size: '20-50',
        impactAreas: ['Clean Energy'],
        impactAreasOther: ['Making Food'],
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
          desiredYoe: ['0-2', '3-5'],
          desiredSkills: ['react', 'sketch'],
          jdUrl: 'comeflipforbob.com/apply',
          desiredOtherSkills: ['flipping burgers', 'flipping houses'],
          visaSponsorship: 'no',
          similarStaffed: true,
          desiredImpactExp:
            'We would love to find someone who has non-profit fast food experience.',
        },
      ],
    };
    const { organization, contact } = reqPayload;
    const mockResolvedBatch = {
      id: 1,
      acceptedPrivacy: new Date('2023-01-01'),
      orgName: organization.name,
      orgType: organization.type,
      orgSize: organization.size,
      impactAreas: organization.impactAreas,
      impactAreasOther: organization.impactAreasOther || [],
      contactName: contact.name,
      contactPhone: contact.phone || null,
      contactEmail: contact.email,
      equalOpportunityEmployer: organization.eoe,
      referenceAttribution: 'linkedin',
      referenceAttributionOther: null,
    };
    mockCtx.prisma.$transaction.mockResolvedValue([mockResolvedBatch]);
    const response =
      await opportunityController.createOpportunityBatch(reqPayload);
    const { equalOpportunityEmployer, ...restOfReolved } = mockResolvedBatch;
    expect(response).toEqual({ eoe: organization.eoe, ...restOfReolved });
  });
  test('Should return error when Prisma throws an invalid input error', async () => {
    const mockError = new Prisma.PrismaClientKnownRequestError('ERROR', {
      code: '101',
      clientVersion: '1.0',
    });
    mockCtx.prisma.$transaction.mockRejectedValue(mockError);
    const opportunityController = new OpportunityController(
      ctx.prisma,
      new DummyEmailService(
        new DummySESService(),
        new DummySQSService(),
        getMockConfig(),
      ),
    );
    const reqPayload: OpportunityBatchRequestBody = {
      acceptedPrivacy: true,
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
          roleType: 'software engineer',
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
          desiredOtherSkills: ['frying fries', 'frying eggs'],
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
    ).rejects.toEqual(mockError);
  });

  test('Should send org welcome email after organization submits a batch of opportunities', async () => {
    const emailService = new EmailService(
      new DummySESService(),
      new DummySQSService(),
      getMockConfig(),
    );

    const mockEmailSpy = jest.spyOn(emailService, 'sendEmail');
    const orgEmail = 'bboberson@gmail.com';
    const reqPayload: OpportunityBatchRequestBody = {
      acceptedPrivacy: true,
      referenceAttribution: 'other',
      organization: {
        name: 'Bobs Burgers Foundation',
        type: '501(c)(3)',
        size: '20-50',
        impactAreas: ['Clean Energy'],
        impactAreasOther: ['Making Food'],
        eoe: true,
      },
      contact: {
        name: 'Bob Boberson',
        email: orgEmail,
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
          desiredYoe: ['0-2', '3-5'],
          desiredSkills: ['react', 'sketch'],
          jdUrl: 'comeflipforbob.com/apply',
          desiredOtherSkills: ['flipping burgers', 'flipping houses'],
          visaSponsorship: 'no',
          similarStaffed: true,
          desiredImpactExp:
            'We would love to find someone who has non-profit fast food experience.',
        },
      ],
    };
    const { organization, contact } = reqPayload;
    const mockResolvedBatch = {
      id: 1,
      acceptedPrivacy: new Date('2023-01-01'),
      orgName: organization.name,
      orgType: organization.type,
      orgSize: organization.size,
      impactAreas: organization.impactAreas,
      impactAreasOther: organization.impactAreasOther || [],
      contactName: contact.name,
      contactPhone: contact.phone || null,
      contactEmail: contact.email,
      equalOpportunityEmployer: organization.eoe,
      referenceAttribution: 'linkedin',
      referenceAttributionOther: null,
    };
    mockCtx.prisma.$transaction.mockResolvedValue([mockResolvedBatch]);

    const opportunityController = new OpportunityController(
      ctx.prisma,
      emailService,
    );

    const expectedEmail = emailService.generateOrgWelcomeEmail(orgEmail);

    await opportunityController.createOpportunityBatch(reqPayload);

    expect(mockEmailSpy).toHaveBeenCalledWith(expectedEmail);
    mockEmailSpy.mockRestore();
  });
});
