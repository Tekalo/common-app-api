import { jest } from '@jest/globals';
import { Prisma } from '@prisma/client';
import ApplicantController from '@App/controllers/ApplicantController.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import EmailService from '@App/services/EmailService.js';
import DummyEmailService from '@App/tests/fixtures/DummyEmailService.js';
import DummyAuthService from '@App/tests/fixtures/DummyAuthService.js';
import UploadService from '@App/services/UploadService.js';
import DummyUploadService from '@App/tests/fixtures/DummyUploadService.js';
import {
  MockContext,
  Context,
  createMockContext,
} from '@App/tests/util/context.js';
import DummySQSService from '@App/tests/fixtures/DummySQSService.js';
import DummyS3Service from '@App/tests/fixtures/DummyS3Service.js';
import { getAPIRequestBody } from '@App/tests/fixtures/applicantSubmissionGenerator.js';
import {
  PrismaApplicantSubmissionWithResume,
  RawApplicantSubmissionBody,
} from '@App/resources/types/applicants.js';
import { Applicants, Shared } from '@capp/schemas';
import { ZodError, ZodIssueCode } from 'zod';
import auth0ResponseGenerator from '@App/tests/fixtures/auth0ManagementAPIResponseGenerator.js';
import { getMockConfig } from '../../util/helpers.js';

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
        throw new Error('RuhRoh! failed to create Auth0 user');
      };
      const applicantController = new ApplicantController(
        dummyAuthService,
        ctx.prisma,
        new DummyEmailService(new DummySQSService(), getMockConfig()),
        new DummyUploadService(
          ctx.prisma,
          new DummyS3Service(),
          getMockConfig(),
        ),
      );
      await expect(
        applicantController.createApplicant({
          name: 'Bob Boberson',
          email: 'bboberson@tekalo.org',
          preferredContact: 'email',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        }),
      ).rejects.toHaveProperty(
        'message',
        'RuhRoh! failed to create Auth0 user',
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
        new DummySQSService(),
        getMockConfig(),
      );

      const applicantController = new ApplicantController(
        dummyAuthService,
        ctx.prisma,
        mockEmailService,
        new DummyUploadService(
          ctx.prisma,
          new DummyS3Service(),
          getMockConfig(),
        ),
      );

      mockCtx.prisma.applicant.create.mockResolvedValue({
        id: 1,
        phone: '777-777-7777',
        name: 'Bob Boberson',
        email: 'bboberson@tekalo.org',
        pronoun: 'he/his',
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
          email: 'bboberson@tekalo.org',
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
      const mockError = new Prisma.PrismaClientKnownRequestError('ERROR', {
        code: '101',
        clientVersion: '1.0',
      });
      mockCtx.prisma.applicant.create.mockRejectedValue(mockError);
      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        new DummyEmailService(new DummySQSService(), getMockConfig()),
        new DummyUploadService(
          ctx.prisma,
          new DummyS3Service(),
          getMockConfig(),
        ),
      );
      await expect(
        applicantController.createApplicant({
          name: 'Bob Boberson',
          email: 'bboberson@tekalo.org',
          pronoun: 'he/his',
          preferredContact: 'email',
          searchStatus: 'active',
          acceptedTerms: true,
          acceptedPrivacy: true,
        }),
      ).rejects.toEqual(mockError);
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
        new DummyEmailService(new DummySQSService(), getMockConfig()),
        new DummyUploadService(
          ctx.prisma,
          new DummyS3Service(),
          getMockConfig(),
        ),
      );
      await expect(
        applicantController.createApplicant({
          name: 'Bob Boberson',
          email: 'bboberson@tekalo.org',
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
        email: 'bboberson@tekalo.org',
        pronoun: 'he/his',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        auth0Id: 'auth0|1234',
        isPaused: false,
        followUpOptIn: false,
      });

      const mockEmailService = new EmailService(
        new DummySQSService(),
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
        new DummyUploadService(
          ctx.prisma,
          new DummyS3Service(),
          getMockConfig(),
        ),
      );

      const resp = await applicantController.createApplicant({
        name: 'Bob Boberson',
        email: 'bboberson@tekalo.org',
        pronoun: 'he/his',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      expect(resp).toMatchObject({
        id: 1,
        auth0Id: expect.stringMatching('^auth0\\|.+'),
        email: 'bboberson@tekalo.org',
      });
      mockEmailSpy.mockRestore();
    });
    test('Should send welcome email after applicant registration for un-authenticated users', async () => {
      mockCtx.prisma.applicant.create.mockResolvedValue({
        id: 1,
        phone: '777-777-7777',
        name: 'Bob Boberson',
        email: 'bboberson@tekalo.org',
        pronoun: 'he/his',
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
        new DummySQSService(),
        getMockConfig({ webUrl }),
      );

      const mockEmailSpy = jest.spyOn(emailService, 'sendEmail');

      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        emailService,
        new DummyUploadService(
          ctx.prisma,
          new DummyS3Service(),
          getMockConfig(),
        ),
      );

      const bobEmail = 'bboberson@tekalo.org';

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
        email: 'bboberson@tekalo.org',
        pronoun: 'he/his',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        auth0Id: 'auth0|1234',
        isPaused: false,
        followUpOptIn: false,
      });
      const dummyEmailService = new DummyEmailService(
        new DummySQSService(),
        getMockConfig(),
      );
      const mockEmailSpy = jest.spyOn(dummyEmailService, 'sendEmail');
      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        dummyEmailService,
        new DummyUploadService(
          ctx.prisma,
          new DummyS3Service(),
          getMockConfig(),
        ),
      );
      const bobEmail = 'bboberson@tekalo.org';

      const auth = {
        header: {},
        token: '',
        payload: {
          sub: 'google-oauth-2|12345678',
          'auth0.capp.com/email': 'bboberson@tekalo.org',
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
        email: 'bboberson@tekalo.org',
        pronoun: 'he/his',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        auth0Id: 'auth0|1234',
        isPaused: false,
        followUpOptIn: false,
      });
      const mockError = new Prisma.PrismaClientKnownRequestError('ERROR', {
        code: '101',
        clientVersion: '1.0',
      });
      mockCtx.prisma.$transaction.mockRejectedValue(mockError);
      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        new DummyEmailService(new DummySQSService(), getMockConfig()),
        new DummyUploadService(
          ctx.prisma,
          new DummyS3Service(),
          getMockConfig(),
        ),
      );
      await expect(applicantController.deleteApplicant(3)).rejects.toEqual(
        mockError,
      );
    });
    test('Should return error if Auth0 fails to delete applicant', async () => {
      mockCtx.prisma.applicant.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        phone: '777-777-7777',
        name: 'Bob Boberson',
        email: 'bboberson@tekalo.org',
        pronoun: 'he/his',
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
      dummyAuthService.deleteUsers = () => {
        throw new CAPPError({
          detail: 'Mock Auth0 Deletion Error',
          title: 'Mock Error',
        });
      };
      const applicantController = new ApplicantController(
        dummyAuthService,
        ctx.prisma,
        new DummyEmailService(new DummySQSService(), getMockConfig()),
        new DummyUploadService(
          ctx.prisma,
          new DummyS3Service(),
          getMockConfig(),
        ),
      );
      await expect(
        applicantController.deleteApplicant(3),
      ).rejects.toHaveProperty('problem.detail', 'Mock Auth0 Deletion Error');
    });
    test('Should delete applicant resumes from s3', async () => {
      mockCtx.prisma.applicant.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        phone: '777-777-7777',
        name: 'Bob Boberson',
        email: 'bboberson@tekalo.org',
        pronoun: 'he/his',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        auth0Id: 'auth0|1234',
        isPaused: false,
        followUpOptIn: false,
      });
      mockCtx.prisma.$transaction.mockResolvedValue(true);
      const mockS3Service = new DummyS3Service();
      const s3ServiceSpy = jest.spyOn(mockS3Service, 'deleteUploads');

      const uploadBucket = 'upload_bucket';
      const mockConfig = getMockConfig({ uploadBucket });

      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        new DummyEmailService(new DummySQSService(), mockConfig),
        new DummyUploadService(ctx.prisma, mockS3Service, mockConfig),
      );
      await applicantController.deleteApplicant(1);
      expect(s3ServiceSpy).toHaveBeenCalledWith(uploadBucket, 'resumes/1');
    });
    test('Should return error if there is an error deleting files from s3', async () => {
      mockCtx.prisma.applicant.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        phone: '777-777-7777',
        name: 'Bob Boberson',
        email: 'bboberson@tekalo.org',
        pronoun: 'he/his',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        auth0Id: 'auth0|1234',
        isPaused: false,
        followUpOptIn: false,
      });
      mockCtx.prisma.$transaction.mockResolvedValue(true);
      const dummyS3Service = new DummyS3Service();
      dummyS3Service.deleteUploads = () => {
        throw new CAPPError({
          detail: 'Mock S3 Deletion Error',
          title: 'Mock Error',
        });
      };
      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        new DummyEmailService(new DummySQSService(), getMockConfig()),
        new DummyUploadService(ctx.prisma, dummyS3Service, getMockConfig()),
      );
      await expect(
        applicantController.deleteApplicant(1),
      ).rejects.toHaveProperty('problem.detail', 'Mock S3 Deletion Error');
    });
    test('Should send email after applicant deletion request', async () => {
      mockCtx.prisma.applicant.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        phone: '777-777-7777',
        name: 'Bob Boberson',
        email: 'bboberson@tekalo.org',
        pronoun: 'he/his',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        auth0Id: 'auth0|1234',
        isPaused: false,
        followUpOptIn: false,
      });

      const emailService = new EmailService(
        new DummySQSService(),
        getMockConfig(),
      );

      const mockEmailSpy = jest.spyOn(emailService, 'sendEmail');

      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        emailService,
        new DummyUploadService(
          ctx.prisma,
          new DummyS3Service(),
          getMockConfig(),
        ),
      );

      await applicantController.deleteApplicant(1);
      const expectedEmail = emailService.generateApplicantDeletionEmail(
        'bboberson@tekalo.org',
        'Bob Boberson',
      );
      expect(mockEmailSpy).toHaveBeenCalledWith(expectedEmail);
      mockEmailSpy.mockRestore();
    });
  });

  describe('Force Delete Applicant (Admin functionality)', () => {
    test('Should return error if Prisma fails to delete applicant', async () => {
      mockCtx.prisma.applicant.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        phone: '777-777-7777',
        name: 'Bob Boberson',
        email: 'bboberson@tekalo.org',
        pronoun: 'he/his',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        auth0Id: 'auth0|1234',
        isPaused: false,
        followUpOptIn: false,
      });
      const mockError = new Prisma.PrismaClientKnownRequestError('ERROR', {
        code: '101',
        clientVersion: '1.0',
      });
      mockCtx.prisma.applicant.delete.mockRejectedValue(mockError);
      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        new DummyEmailService(new DummySQSService(), getMockConfig()),
        new DummyUploadService(
          ctx.prisma,
          new DummyS3Service(),
          getMockConfig(),
        ),
      );
      await expect(applicantController.deleteApplicantForce(3)).rejects.toEqual(
        mockError,
      );
    });
    test('Should return error if Auth0 fails to delete applicant', async () => {
      mockCtx.prisma.applicant.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        phone: '777-777-7777',
        name: 'Bob Boberson',
        email: 'bboberson@tekalo.org',
        pronoun: 'he/his',
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
      dummyAuthService.deleteUsers = () => {
        throw new CAPPError({
          detail: 'Mock Auth0 Deletion Error',
          title: 'Mock Error',
        });
      };
      const applicantController = new ApplicantController(
        dummyAuthService,
        ctx.prisma,
        new DummyEmailService(new DummySQSService(), getMockConfig()),
        new DummyUploadService(
          ctx.prisma,
          new DummyS3Service(),
          getMockConfig(),
        ),
      );
      await expect(
        applicantController.deleteApplicantForce(3),
      ).rejects.toHaveProperty('problem.detail', 'Mock Auth0 Deletion Error');
    });
    test('Should delete applicant resumes from s3', async () => {
      mockCtx.prisma.applicant.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        phone: '777-777-7777',
        name: 'Bob Boberson',
        email: 'bboberson@tekalo.org',
        pronoun: 'he/his',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        auth0Id: 'auth0|1234',
        isPaused: false,
        followUpOptIn: false,
      });
      mockCtx.prisma.$transaction.mockResolvedValue(true);
      const mockS3Service = new DummyS3Service();
      const s3ServiceSpy = jest.spyOn(mockS3Service, 'deleteUploads');

      const uploadBucket = 'upload_bucket';
      const mockConfig = getMockConfig({ uploadBucket });

      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        new DummyEmailService(new DummySQSService(), mockConfig),
        new DummyUploadService(ctx.prisma, mockS3Service, mockConfig),
      );
      await applicantController.deleteApplicantForce(1);
      expect(s3ServiceSpy).toHaveBeenCalledWith(uploadBucket, 'resumes/1');
    });
    test('Should return error if there is an error deleting files from s3', async () => {
      mockCtx.prisma.applicant.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        phone: '777-777-7777',
        name: 'Bob Boberson',
        email: 'bboberson@tekalo.org',
        pronoun: 'he/his',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        auth0Id: 'auth0|1234',
        isPaused: false,
        followUpOptIn: false,
      });
      mockCtx.prisma.$transaction.mockResolvedValue(true);
      const dummyS3Service = new DummyS3Service();
      dummyS3Service.deleteUploads = () => {
        throw new CAPPError({
          detail: 'Mock S3 Deletion Error',
          title: 'Mock Error',
        });
      };
      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        new DummyEmailService(new DummySQSService(), getMockConfig()),
        new DummyUploadService(ctx.prisma, dummyS3Service, getMockConfig()),
      );
      await expect(
        applicantController.deleteApplicantForce(1),
      ).rejects.toHaveProperty('problem.detail', 'Mock S3 Deletion Error');
    });
    test('Should not send email after applicant deletion request', async () => {
      mockCtx.prisma.applicant.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        phone: '777-777-7777',
        name: 'Bob Boberson',
        email: 'bboberson@tekalo.org',
        pronoun: 'he/his',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        auth0Id: 'auth0|1234',
        isPaused: false,
        followUpOptIn: false,
      });

      const emailService = new EmailService(
        new DummySQSService(),
        getMockConfig(),
      );

      const mockEmailSpy = jest.spyOn(emailService, 'sendEmail');

      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        emailService,
        new DummyUploadService(
          ctx.prisma,
          new DummyS3Service(),
          getMockConfig(),
        ),
      );

      await applicantController.deleteApplicantForce(1);
      expect(mockEmailSpy).not.toHaveBeenCalled();
      mockEmailSpy.mockRestore();
    });
  });

  describe('Cleanup Test Applicants (Admin functionality)', () => {
    test('Should call deleteApplicantForce for each test applicant it finds', async () => {
      // Mock deleteApplicantForce
      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        new DummyEmailService(new DummySQSService(), getMockConfig()),
        new DummyUploadService(
          ctx.prisma,
          new DummyS3Service(),
          getMockConfig(),
        ),
      );

      // deleteApplicantForce should succeed every time
      const deleteForceSpy = jest
        .spyOn(applicantController, 'deleteApplicantForce')
        .mockImplementation((applicantId: number) =>
          Promise.resolve(Shared.IdOnlySchema.parse({ id: applicantId })),
        );

      // Mock IDs for test applicants
      mockCtx.prisma.$queryRaw.mockResolvedValueOnce([
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);

      await applicantController.deleteTestApplicants();
      expect(deleteForceSpy).toHaveBeenCalledTimes(3);
      deleteForceSpy.mockRestore();
    });

    test('Should resolve gracefully when there are no test values to delete', async () => {
      // Mock deleteApplicantForce
      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        new DummyEmailService(new DummySQSService(), getMockConfig()),
        new DummyUploadService(
          ctx.prisma,
          new DummyS3Service(),
          getMockConfig(),
        ),
      );

      // deleteApplicantForce should succeed every time
      const deleteForceSpy = jest
        .spyOn(applicantController, 'deleteApplicantForce')
        .mockImplementation((applicantId: number) =>
          Promise.resolve(Shared.IdOnlySchema.parse({ id: applicantId })),
        );
      // Mock IDs for test applicants
      mockCtx.prisma.$queryRaw.mockResolvedValueOnce([]);

      await applicantController.deleteTestApplicants();
      expect(deleteForceSpy).not.toHaveBeenCalled();
      deleteForceSpy.mockRestore();
    });

    test('Should return error if any of the test applicants fail to be deleted', async () => {
      // Mock deleteApplicantForce
      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        new DummyEmailService(new DummySQSService(), getMockConfig()),
        new DummyUploadService(
          ctx.prisma,
          new DummyS3Service(),
          getMockConfig(),
        ),
      );

      // Should succeed the first time and fail subsequent times
      const deleteForceSpy = jest
        .spyOn(applicantController, 'deleteApplicantForce')
        .mockImplementationOnce((applicantId: number) =>
          Promise.resolve(Shared.IdOnlySchema.parse({ id: applicantId })),
        )
        .mockImplementation(() => {
          throw new CAPPError({
            detail: 'Mock Delete Applicant Force Error',
            title: 'Mock Error',
          });
        });

      mockCtx.prisma.$queryRaw.mockResolvedValueOnce([
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);

      await expect(
        applicantController.deleteTestApplicants(),
      ).rejects.toHaveProperty(
        'problem.detail',
        'Mock Delete Applicant Force Error',
      );
      deleteForceSpy.mockRestore();
    });
  });

  describe('Test white list functionality in EmailService to avoid too many email bounces in dev', () => {
    test('Should not send email if email not on white list in dev env', async () => {
      mockCtx.prisma.applicant.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        phone: '777-777-7777',
        name: 'Bob Boberson',
        email: 'Aboberson@tekalo.org',
        pronoun: 'he/his',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        auth0Id: 'auth0|1234',
        isPaused: false,
        followUpOptIn: false,
      });

      const mockConfig = getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
          sesWhiteList: ['bboberson@gmail.com'],
          emailQueueUrl:
            'https://sqs.us-east-1.amazonaws.com/123456789/email-sqs-queue',
        },
        env: 'dev',
        useEmailWhiteList: true,
      });
      const sqsService = new DummySQSService();
      const emailService = new EmailService(sqsService, mockConfig);

      const mockEmailSpy = jest.spyOn(sqsService, 'enqueueMessage');

      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        emailService,
        new DummyUploadService(ctx.prisma, new DummyS3Service(), mockConfig),
      );

      await applicantController.deleteApplicant(1);
      expect(mockEmailSpy).not.toHaveBeenCalled();
      mockEmailSpy.mockRestore();
    });
    test('Should send email if email on white list in dev env', async () => {
      mockCtx.prisma.applicant.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        phone: '777-777-7777',
        name: 'Bob Boberson',
        email: 'bboberson+123xyz@gmail.com',
        pronoun: 'he/his',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        auth0Id: 'auth0|1234',
        isPaused: false,
        followUpOptIn: false,
      });

      const mockConfig = getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
          sesWhiteList: ['bboberson@gmail.com'],
          emailQueueUrl:
            'https://sqs.us-east-1.amazonaws.com/123456789/email-sqs-queue',
        },
        env: 'dev',
        useEmailWhiteList: true,
      });
      const sqsService = new DummySQSService();
      const emailService = new EmailService(sqsService, mockConfig);
      const mockEmailSpy = jest.spyOn(sqsService, 'enqueueMessage');

      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        emailService,
        new DummyUploadService(ctx.prisma, new DummyS3Service(), mockConfig),
      );

      await applicantController.deleteApplicant(1);
      expect(mockEmailSpy).toHaveBeenCalled();
      mockEmailSpy.mockRestore();
    });
    test('Should send email even if email not on white list in prod env', async () => {
      mockCtx.prisma.applicant.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        phone: '777-777-7777',
        name: 'Bob Boberson',
        email: 'bboberson@tekalo.org',
        pronoun: 'he/his',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        auth0Id: 'auth0|1234',
        isPaused: false,
        followUpOptIn: false,
      });

      const mockConfig = getMockConfig({
        aws: {
          sesFromAddress: 'baz@futurestech.com',
          sesReplyToAddress: 'replies@futurestech.com',
          region: 'us-east-1',
          sesWhiteList: ['bboberson@gmail.com'],
          emailQueueUrl:
            'https://sqs.us-east-1.amazonaws.com/123456789/email-sqs-queue',
        },
        env: 'prod',
        useEmailWhiteList: false,
      });
      const sqsService = new DummySQSService();
      const emailService = new EmailService(sqsService, mockConfig);
      const mockEmailSpy = jest.spyOn(sqsService, 'enqueueMessage');

      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        emailService,
        new DummyUploadService(ctx.prisma, new DummyS3Service(), mockConfig),
      );

      await applicantController.deleteApplicant(1);
      expect(mockEmailSpy).toHaveBeenCalled();
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
      dummyAuthService.deleteUsers = () => {
        throw new CAPPError({
          detail: 'Mock Auth0 Deletion Error',
          title: 'Mock Error',
        });
      };
      const applicantController = new ApplicantController(
        dummyAuthService,
        ctx.prisma,
        new DummyEmailService(new DummySQSService(), getMockConfig()),
        new DummyUploadService(
          ctx.prisma,
          new DummyS3Service(),
          getMockConfig(),
        ),
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
        email: 'bboberson@tekalo.org',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        followUpOptIn: false,
      });

      const emailService = new EmailService(
        new DummySQSService(),
        getMockConfig(),
      );

      const mockEmailSpy = jest.spyOn(emailService, 'sendEmail');
      const mockUser = {
        name: 'Bob Boberson',
        email: 'bboberson@tekalo.org',
        auth0Id: 'auth0|12345',
      };

      const dummyAuthService = new DummyAuthService();
      dummyAuthService.getUser = () =>
        Promise.resolve({
          data: auth0ResponseGenerator.getMockUserCreateResponse(
            mockUser.auth0Id,
            { name: mockUser.name, email: mockUser.email },
          ),
          status: 200,
          headers: new Headers(),
          statusText: '',
        });

      const applicantController = new ApplicantController(
        dummyAuthService,
        ctx.prisma,
        emailService,
        new DummyUploadService(
          ctx.prisma,
          new DummyS3Service(),
          getMockConfig(),
        ),
      );

      await applicantController.deleteAuth0OnlyApplicant('auth|12345');
      const expectedEmail = emailService.generateApplicantDeletionCompleteEmail(
        mockUser.email,
        mockUser.name,
      );
      expect(mockEmailSpy).toHaveBeenCalledWith(expectedEmail);
      mockEmailSpy.mockRestore();
    });
  });

  describe('Applicant Create Submission', () => {
    test('Should send post-submission email after applicant submits application', async () => {
      const applicantId = 666;
      const resolvedValue: PrismaApplicantSubmissionWithResume = {
        id: 445566,
        createdAt: new Date(),
        updatedAt: new Date(),
        applicantId,
        originTag: '',
        lastRole: 'senior software engineer',
        lastOrg: 'mozilla',
        yoe: '>11',
        skills: ['react', 'python'], // enum
        linkedInUrl: 'https://www.linkedin.com/in/bob-bobberson',
        githubUrl: 'https://github.com/bboberson',
        portfolioUrl: null,
        portfolioPassword: '',
        resumeUploadId: 1,
        resumeUpload: {
          id: 1,
          originalFilename: 'My_Tekalo_Resume.pdf',
        },
        resumeUrl: null,
        resumePassword: null,
        hoursPerWeek: null,
        interestEmploymentType: ['full'], // enum
        interestWorkArrangement: ['contractor', 'advisor'],
        interestRoles: [
          'software engineer - frontend',
          'software engineer - backend',
        ],
        currentLocation: 'Boston, MA',
        openToRelocate: 'not sure',
        openToRemoteMulti: ['not sure'],
        desiredSalary: '100,000',
        interestCauses: ['climate change', 'responsible AI'],
        workAuthorization: 'sponsorship',
        interestGovt: true,
        interestGovtEmplTypes: ['paid'],
        previousImpactExperience: false,
        essayResponse:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non iaculis erat.',
        referenceAttribution: 'social media', // enum
        referenceAttributionOther: null,
      };

      mockCtx.prisma.applicantSubmission.create.mockResolvedValue(
        resolvedValue,
      );

      const bobEmail = 'bboberson@tekalo.org';
      mockCtx.prisma.applicant.findUniqueOrThrow.mockResolvedValue({
        id: applicantId,
        phone: '777-777-7777',
        name: 'Bob Boberson',
        email: bobEmail,
        pronoun: 'he/his',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: new Date('2023-02-01'),
        acceptedPrivacy: new Date('2023-02-01'),
        auth0Id: 'auth0|1234',
        isPaused: false,
        followUpOptIn: false,
      });
      mockCtx.prisma.$transaction.mockResolvedValue([resolvedValue, []]);
      mockCtx.prisma.upload.findFirst.mockResolvedValue({
        id: 1,
        applicantId,
        originalFilename: 'myresume.pdf',
        type: 'RESUME',
        status: 'SUCCESS',
        createdAt: new Date('2023-02-01'),
        completedAt: new Date('2023-02-01'),
        contentType: 'application/pdf',
      });

      const emailService = new EmailService(
        new DummySQSService(),
        getMockConfig(),
      );

      const mockEmailSpy = jest.spyOn(emailService, 'sendEmail');

      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        emailService,
        new DummyUploadService(
          ctx.prisma,
          new DummyS3Service(),
          getMockConfig(),
        ),
      );

      const testBody = getAPIRequestBody(applicantId);
      await applicantController.createSubmission(
        applicantId,
        Applicants.ApplicantCreateSubmissionRequestBodySchema.parse(testBody),
      );

      const expectedEmail =
        emailService.generateApplicantPostSubmitEmail(bobEmail);
      expect(mockEmailSpy).toHaveBeenCalledWith(expectedEmail);
      mockEmailSpy.mockRestore();
    });

    test('Should throw Zod validation error if getApplicantUpload() returns null', async () => {
      const dummyUploadService = new DummyUploadService(
        ctx.prisma,
        new DummyS3Service(),
        getMockConfig(),
      );

      dummyUploadService.getApplicantUpload = async () => Promise.resolve(null);

      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        new DummyEmailService(new DummySQSService(), getMockConfig()),
        dummyUploadService,
      );
      const requestBody: RawApplicantSubmissionBody = getAPIRequestBody(1);

      await expect(
        applicantController.createSubmission(
          1,
          Applicants.ApplicantCreateSubmissionRequestBodySchema.parse(
            requestBody,
          ),
        ),
      ).rejects.toBeInstanceOf(ZodError);
    });

    test('Should throw Zod Error if upload belonging to the specified applicant does not have the status "SUCCESS"', async () => {
      const applicantId = 1;
      const dummyUploadService = new DummyUploadService(
        ctx.prisma,
        new DummyS3Service(),
        getMockConfig(),
      );
      dummyUploadService.getApplicantUpload = () =>
        Promise.resolve({
          id: 1,
          applicantId,
          status: 'FAILURE',
          createdAt: new Date(),
          type: 'RESUME',
          originalFilename: 'myresume.pdf',
          completedAt: new Date(),
          contentType: 'application/pdf',
        });
      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        new DummyEmailService(new DummySQSService(), getMockConfig()),
        dummyUploadService,
      );
      const requestBody = getAPIRequestBody(applicantId);

      await expect(
        applicantController.createSubmission(
          applicantId,
          Applicants.ApplicantCreateSubmissionRequestBodySchema.parse(
            requestBody,
          ),
        ),
      ).rejects.toEqual(
        new ZodError([
          {
            message: 'Invalid resume',
            code: ZodIssueCode.custom,
            path: ['resumeUpload.id'],
          },
        ]),
      );
    });

    test('Should return error when Prisma throws a transaction error', async () => {
      const mockError = new Prisma.PrismaClientKnownRequestError('ERROR', {
        code: '101',
        clientVersion: '1.0',
      });
      mockCtx.prisma.$transaction.mockRejectedValue(mockError);

      const applicantId = 666;
      const uploadResumeId = 1;
      const uploadBucket = 'upload_bucket';
      const mockConfig = getMockConfig({ uploadBucket });

      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        new DummyEmailService(new DummySQSService(), mockConfig),
        new DummyUploadService(
          ctx.prisma,
          new DummyS3Service(),
          getMockConfig(),
        ),
      );
      mockCtx.prisma.upload.findFirst.mockResolvedValue({
        id: uploadResumeId,
        applicantId,
        originalFilename: 'myresume.pdf',
        type: 'RESUME',
        status: 'SUCCESS',
        createdAt: new Date('2023-02-01'),
        completedAt: new Date('2023-02-01'),
        contentType: 'application/pdf',
      });

      const testBody = getAPIRequestBody(uploadResumeId);
      await expect(
        applicantController.createSubmission(
          applicantId,
          Applicants.ApplicantCreateSubmissionRequestBodySchema.parse(testBody),
        ),
      ).rejects.toEqual(mockError);
    });
  });

  describe('Applicant Get Resume Upload Url', () => {
    test('Should call upload service to generate a signed resume upload url', async () => {
      const applicantId = 666;
      const uploadBucket = 'upload_bucket';
      const mockConfig = getMockConfig({ uploadBucket });
      const uploadService = new UploadService(
        ctx.prisma,
        new DummyS3Service(),
        mockConfig,
      );

      mockCtx.prisma.upload.create.mockResolvedValue({
        id: 1,
        applicantId,
        type: 'RESUME',
        originalFilename: 'bobsresume.docx',
        status: 'REQUESTED',
        createdAt: new Date(),
        completedAt: null,
        contentType: 'application/pdf',
      });

      const mockUploadSpy = jest.spyOn(
        uploadService,
        'generateSignedResumeUploadUrl',
      );

      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        new DummyEmailService(new DummySQSService(), mockConfig),
        uploadService,
      );

      const originalFilename = 'originalResumeFilename.png';
      const contentType = 'application/png';
      const result = await applicantController.getResumeUploadUrl(applicantId, {
        originalFilename,
        contentType,
      });

      expect(mockUploadSpy).toHaveBeenCalledWith(
        applicantId,
        originalFilename,
        contentType,
      );
      expect(result).toHaveProperty(
        'signedLink',
        expect.stringMatching(
          `https://${uploadBucket}.*/resumes/${applicantId}.*`,
        ),
      );
    });
  });

  describe('Applicant Get Resume File', () => {
    test('Should return 404 if applicant does not have a resume', async () => {
      const applicantId = 666;
      const uploadBucket = 'upload_bucket';
      const mockConfig = getMockConfig({ uploadBucket });
      const uploadService = new UploadService(
        ctx.prisma,
        new DummyS3Service(),
        mockConfig,
      );

      mockCtx.prisma.upload.findFirst.mockResolvedValue(null);

      const applicantController = new ApplicantController(
        new DummyAuthService(),
        ctx.prisma,
        new DummyEmailService(new DummySQSService(), mockConfig),
        uploadService,
      );

      await expect(
        applicantController.getResumeDownloadUrl(applicantId),
      ).rejects.toEqual(
        new CAPPError({
          title: 'Not Found',
          detail: 'Resume not found',
          status: 404,
        }),
      );
    });
  });
});
