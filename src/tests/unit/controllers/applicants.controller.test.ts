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
import { ApplicantSubmission, Prisma } from '@prisma/client';
import DummyMonitoringService from '@App/tests/fixtures/DummyMonitoringService.js';
import SESService from '@App/services/SESService.js';
import DummySESService from '@App/tests/fixtures/DummySesService.js';
import applicantSubmissionGenerator from '@App/tests/fixtures/applicantSubmissionGenerator.js';

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
    test('Should return 401 if user with email already exists in Auth0 but not in database', async () => {
      const dummyAuthService = new DummyAuthService();
      dummyAuthService.createUser = () => {
        throw new CAPPError({
          title: 'User Creation Error',
          detail: 'User already exists',
          status: 409,
        });
      };

      dummyAuthService.userExists = () => Promise.resolve(true);

      const mockEmailService = new EmailService(
        new SESService(),
        getMockConfig(),
      );

      const applicantController = new ApplicantController(
        dummyAuthService,
        ctx.prisma,
        mockEmailService,
        new DummyMonitoringService(),
      );

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
      ).rejects.toEqual(
        new CAPPError({
          title: 'Auth0 User Exists',
          detail: 'User must login',
          status: 401,
        }),
      );
    });
    test('Should return 500 error if Prisma fails with unknown error', async () => {
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
    test('Should return 409 error if Prisma fails because applicant with email already exists in database', async () => {
      mockCtx.prisma.applicant.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('ERROR', {
          code: 'P2002',
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
      ).rejects.toHaveProperty('problem.status', 409);
    });
    test('Should successfully return if applicant saved but post-registration email fails to send', async () => {
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
    test('Should send welcome email after applicant registration for un-authenticated users', async () => {
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

      const webUrl = process.env.WEB_URL || '';
      const emailService = new EmailService(
        new SESService(),
        getMockConfig({ webUrl }),
      );

      const mockEmailSpy = jest.spyOn(emailService, 'sendEmail');

      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        emailService,
        new DummyMonitoringService(),
      );

      const bobEmail = 'bboberson@schmidtfutures.com';

      await applicantController.createApplicant({
        name: 'Bob Boberson',
        email: bobEmail,
        pronoun: 'he/his',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      const expectedEmail = emailService.generateApplicantWelcomeEmail(
        bobEmail,
        'fake-ticket',
        `${webUrl}/sign-in`,
      );
      expect(mockEmailSpy).toHaveBeenCalledWith(expectedEmail);
      mockEmailSpy.mockRestore();
    });
    test('Should not send welcome email after applicant registration users authenticated via social-provider', async () => {
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
      const dummyEmailService = new DummyEmailService(
        new DummySESService(),
        getMockConfig(),
      );
      const mockEmailSpy = jest.spyOn(dummyEmailService, 'sendEmail');
      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        dummyEmailService,
        new DummyMonitoringService(),
      );
      const bobEmail = 'bboberson@schmidtfutures.com';

      const auth = {
        header: {},
        token: '',
        payload: {
          sub: 'google-oauth-2|12345678',
          'auth0.capp.com/email': 'bboberson@schmidtfutures.com',
          'auth0.capp.com/roles': [],
        },
      };
      await applicantController.createApplicant(
        {
          name: 'Bob Boberson',
          email: bobEmail,
          pronoun: 'he/his',
          preferredContact: 'email',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        },
        auth,
      );
      expect(mockEmailSpy).not.toHaveBeenCalled();
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
    test('Should send email after applicant deletion request', async () => {
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

      const emailService = new EmailService(
        new DummySESService(),
        getMockConfig(),
      );

      const mockEmailSpy = jest.spyOn(emailService, 'sendEmail');

      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        emailService,
        new DummyMonitoringService(),
      );

      await applicantController.deleteApplicant(1);
      const expectedEmail = emailService.generateApplicantDeletionEmail(
        'bboberson@schmidtfutures.com',
        'Bob Boberson',
      );
      expect(mockEmailSpy).toHaveBeenCalledWith(expectedEmail);
      mockEmailSpy.mockRestore();
    });
  });

  describe('Delete Auth0 Only Applicant', () => {
    test('Should return error if Auth0 fails to delete applicant', async () => {
      const auth0Id = 'auth0|123456';
      mockCtx.prisma.applicantDeletionRequests.create.mockResolvedValue({
        id: 25,
        applicantId: 0,
        createdAt: new Date('2023-02-01'),
        email: auth0Id,
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        followUpOptIn: false,
      });
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
        applicantController.deleteAuth0OnlyApplicant(auth0Id),
      ).rejects.toHaveProperty('problem.detail', 'Mock Auth0 Deletion Error');
    });

    test('Should send deletion complete email after applicant auth0 only deletion request', async () => {
      mockCtx.prisma.applicantDeletionRequests.create.mockResolvedValue({
        id: 25,
        applicantId: 0,
        createdAt: new Date('2023-02-01'),
        email: 'bboberson@schmidtfutures.com',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        followUpOptIn: false,
      });

      const emailService = new EmailService(
        new DummySESService(),
        getMockConfig(),
      );

      const mockEmailSpy = jest.spyOn(emailService, 'sendEmail');

      const dummyAuthService = new DummyAuthService();
      dummyAuthService.getUser = () =>
        Promise.resolve({
          id: 'auth|12345',
          email: 'bboberson@schmidtfutures.com',
          name: 'Bob Boberson',
        });

      const applicantController = new ApplicantController(
        dummyAuthService,
        ctx.prisma,
        emailService,
        new DummyMonitoringService(),
      );

      await applicantController.deleteAuth0OnlyApplicant('auth|12345');
      const expectedEmail = emailService.generateApplicantDeletionCompleteEmail(
        'bboberson@schmidtfutures.com',
        'Bob Boberson',
      );
      expect(mockEmailSpy).toHaveBeenCalledWith(expectedEmail);
      mockEmailSpy.mockRestore();
    });
  });

  describe('Applicant Create Submission', () => {
    test('Should send post-submission email after applicant submits application', async () => {
      const applicantId = 666;
      const resolvedValue: ApplicantSubmission = {
        id: 445566,
        createdAt: new Date(),
        applicantId,
        originTag: '',
        lastRole: 'senior software engineer',
        lastOrg: 'mozilla',
        yoe: '>11',
        skills: ['react', 'python'], // enum
        otherSkills: ['juggling', 'curling'],
        linkedInUrl: 'https://www.linkedin.com/in/bob-bobberson',
        githubUrl: 'https://github.com/bboberson',
        portfolioUrl: null,
        portfolioPassword: '',
        resumeUrl: 'myportfolio.com',
        resumePassword: null,
        hoursPerWeek: null,
        interestEmploymentType: ['full'], // enum
        interestRoles: [
          'software engineer - frontend',
          'software engineer - backend',
        ],
        currentLocation: 'Boston, MA',
        openToRelocate: 'not sure',
        openToRemote: 'remote',
        openToRemoteMulti: ['remote', 'in-person'],
        desiredSalary: '100,000',
        interestCauses: ['climate change', 'responsible AI'],
        otherCauses: ['animal rights'],
        workAuthorization: 'sponsorship',
        interestGovt: true,
        interestGovtEmplTypes: ['paid'],
        previousImpactExperience: false,
        essayResponse:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non iaculis erat.',
        referenceAttribution: 'social media', // enum
      };

      mockCtx.prisma.applicantSubmission.create.mockResolvedValue(
        resolvedValue,
      );

      const bobEmail = 'bboberson@schmidtfutures.com';
      mockCtx.prisma.applicant.findUniqueOrThrow.mockResolvedValue({
        id: 666,
        phone: '777-777-7777',
        name: 'Bob Boberson',
        email: bobEmail,
        pronoun: 'she/hers',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        auth0Id: 'auth0|1234',
        isPaused: false,
        followUpOptIn: false,
      });

      const emailService = new EmailService(new SESService(), getMockConfig());

      const mockEmailSpy = jest.spyOn(emailService, 'sendEmail');

      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        emailService,
        new DummyMonitoringService(),
      );

      await applicantController.createSubmission(
        applicantId,
        applicantSubmissionGenerator.getAPIRequestBody(),
      );

      const expectedEmail =
        emailService.generateApplicantPostSubmitEmail(bobEmail);
      expect(mockEmailSpy).toHaveBeenCalledWith(expectedEmail);
      mockEmailSpy.mockRestore();
    });
  });
});
