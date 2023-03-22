import ApplicantController from '@App/controllers/ApplicantController.js';
import AuthService from '@App/services/AuthService.js';
import { jest } from '@jest/globals';
import {
  MockContext,
  Context,
  createMockContext,
} from '@App/tests/util/context.js';
import { Prisma } from '@prisma/client';

let mockCtx: MockContext;
let ctx: Context;

beforeEach(() => {
  mockCtx = createMockContext();
  ctx = mockCtx as unknown as Context;
});

export type PrismaCreateInputType = Prisma.ApplicantSelect;

describe('Applicant Controller', () => {
  describe('Create Applicant', () => {
    const mockAuthService = new AuthService();
    const mockCreateApplicant = jest.fn<typeof mockAuthService.createUser>();

    mockAuthService.createUser = mockCreateApplicant;
    test('Should not store new applicant in Auth0', async () => {
      const mockResolved = {
        id: 1,
        name: 'Bob Boberson',
        email: 'bboberson@gmail.com',
        preferredContact: 'sms',
        searchStatus: 'active',
        phone: '123-456-7777',
        pronoun: 'them/they',
        acceptedTCVersion: '2023-04-01',
      };
      mockCtx.prisma.applicant.create.mockResolvedValue(mockResolved);
      const applicantController = new ApplicantController(
        mockAuthService,
        ctx.prisma,
      );
      await applicantController.createApplicant(
        {
          name: 'Bob Boberson',
          email: 'bboerson@schmidtfutures.com',
          preferredContact: 'email',
          searchStatus: 'active',
          acceptedTCVersion: '2023-04-01',
        },
        { auth0: 'false' },
      );
      expect(mockCreateApplicant).toHaveBeenCalledTimes(0);
    });
    test('Should throw error if Prisma fails to create applicant', async () => {
      mockCtx.prisma.applicant.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('ERROR', {
          code: '101',
          clientVersion: '1.0',
        }),
      );
      const applicantController = new ApplicantController(
        mockAuthService,
        ctx.prisma,
      );
      await expect(
        applicantController.createApplicant({
          name: 'Bob Boberson',
          email: 'bboberson@schmidtfutures.com',
          preferredContact: 'email',
          searchStatus: 'active',
          acceptedTCVersion: '2023-04-01',
        }),
      ).rejects.toHaveProperty(
        'problem.detail',
        'Database error encountered when creating new user',
      );
    });
  });
});
