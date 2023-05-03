import ApplicantController from '@App/controllers/ApplicantController.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import EmailService from '@App/services/EmailService.js';
import DummyEmailService from '@App/tests/fixtures/DummyEmailService.js';
import DummyAuthService from '@App/tests/fixtures/DummyAuthService.js';
import { jest } from '@jest/globals';
import {
  MockContext,
  Context,
  createMockContext,
} from '@App/tests/util/context.js';
import { getMockConfig } from '@App/tests/util/helpers.js';
import { Prisma } from '@prisma/client';
import DummyMonitoringService from '@App/tests/fixtures/DummyMonitoringService.js';
import SESService from '@App/services/SESService.js';
import DummySESService from '@App/tests/fixtures/DummySesService.js';

let mockCtx: MockContext;
let ctx: Context;

beforeEach(() => {
  mockCtx = createMockContext();
  ctx = mockCtx as unknown as Context;
});

export type PrismaCreateInputType = Prisma.ApplicantSelect;

describe('Applicant Controller', () => {
  describe('Create Applicant', () => {
    test('Should return error if Auth0 fails to create user', async () => {
      const dummyAuthService = new DummyAuthService();
      dummyAuthService.createUser = () => {
        throw new Error('Auth0 Creation Error');
      };
      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        new DummyEmailService(new DummySESService(), getMockConfig()),
        new DummyMonitoringService(),
      );
      await expect(
        applicantController.createApplicant({
          name: 'Bob Boberson',
          email: 'bboberson@schmidtfutures.com',
          preferredContact: 'email',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        }),
      ).rejects.toHaveProperty(
        'problem.detail',
        'Unknown error in creating applicant',
      );
    });
    test('Should return error if Prisma fails to create applicant', async () => {
      mockCtx.prisma.applicant.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('ERROR', {
          code: '101',
          clientVersion: '1.0',
        }),
      );
      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        new DummyEmailService(new DummySESService(), getMockConfig()),
        new DummyMonitoringService(),
      );
      await expect(
        applicantController.createApplicant({
          name: 'Bob Boberson',
          email: 'bboberson@schmidtfutures.com',
          pronoun: 'he/his',
          preferredContact: 'email',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        }),
      ).rejects.toHaveProperty(
        'problem.detail',
        'Database error encountered when creating new user',
      );
    });
    test('Should successfully return if applicant saved but post-submission email fails to send', async () => {
      mockCtx.prisma.applicant.create.mockResolvedValue({
        id: 1,
        phone: '777-777-7777',
        name: 'Bob Boberson',
        email: 'bboberson@schmidtfutures.com',
        pronoun: 'she/hers',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        auth0Id: 'auth0|1234',
        isPaused: false,
        followUpOptIn: false,
      });

      const mockEmailService = new EmailService(
        new SESService(),
        getMockConfig(),
      );
      const mockEmailSpy = jest
        .spyOn(mockEmailService, 'sendEmail')
        .mockImplementation(() => {
          throw new Error('Ruh roh, failed to send email');
        });

      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        mockEmailService,
        new DummyMonitoringService(),
      );

      const resp = await applicantController.createApplicant({
        name: 'Bob Boberson',
        email: 'bboberson@schmidtfutures.com',
        pronoun: 'he/his',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      expect(resp).toMatchObject({
        id: 1,
        auth0Id: expect.stringMatching('^auth0\\|.+'),
        email: 'bboberson@schmidtfutures.com',
      });
      mockEmailSpy.mockRestore();
    });
    test('Should send welcome email after applicant registration', async () => {
      mockCtx.prisma.applicant.create.mockResolvedValue({
        id: 1,
        phone: '777-777-7777',
        name: 'Bob Boberson',
        email: 'bboberson@schmidtfutures.com',
        pronoun: 'she/hers',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        auth0Id: 'auth0|1234',
        isPaused: false,
        followUpOptIn: false,
      });

      const mockEmailService = new EmailService(
        new SESService(),
        getMockConfig(),
      );

      const mockEmailSpy = jest.spyOn(mockEmailService, 'sendEmail');

      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        mockEmailService,
        new DummyMonitoringService(),
      );

      await applicantController.createApplicant({
        name: 'Bob Boberson',
        email: 'bboberson@schmidtfutures.com',
        pronoun: 'he/his',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      const expectedEmail = mockEmailService.generateWelcomeEmail(
        'bboberson@schmidtfutures.com',
        'fake-ticket',
      );
      expect(mockEmailSpy).toHaveBeenCalledWith(expectedEmail);
      mockEmailSpy.mockRestore();
    });
  });

  describe('Delete Applicant', () => {
    test('Should return error if Prisma fails to delete applicant', async () => {
      mockCtx.prisma.applicant.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        phone: '777-777-7777',
        name: 'Bob Boberson',
        email: 'bboberson@schmidtfutures.com',
        pronoun: 'she/hers',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        auth0Id: 'auth0|1234',
        isPaused: false,
        followUpOptIn: false,
      });
      mockCtx.prisma.$transaction.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('ERROR', {
          code: '101',
          clientVersion: '1.0',
        }),
      );
      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        new DummyEmailService(new DummySESService(), getMockConfig()),
        new DummyMonitoringService(),
      );
      await expect(
        applicantController.deleteApplicant(3),
      ).rejects.toHaveProperty(
        'problem.detail',
        'Database error encountered when deleting applicant',
      );
    });
    test('Should return error if Auth0 fails to delete applicant', async () => {
      mockCtx.prisma.applicant.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        phone: '777-777-7777',
        name: 'Bob Boberson',
        email: 'bboberson@schmidtfutures.com',
        pronoun: 'she/hers',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        auth0Id: 'auth0|1234',
        isPaused: false,
        followUpOptIn: false,
      });
      mockCtx.prisma.$transaction.mockResolvedValue(true);
      const dummyAuthService = new DummyAuthService();
      dummyAuthService.deleteUser = () => {
        throw new CAPPError({
          detail: 'Mock Auth0 Deletion Error',
          title: 'Mock Error',
        });
      };
      const applicantController = new ApplicantController(
        dummyAuthService,
        ctx.prisma,
        new DummyEmailService(new DummySESService(), getMockConfig()),
        new DummyMonitoringService(),
      );
      await expect(
        applicantController.deleteApplicant(3),
      ).rejects.toHaveProperty('problem.detail', 'Mock Auth0 Deletion Error');
    });
  });
});
