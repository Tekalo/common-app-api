import ApplicantController from '@App/controllers/ApplicantController.js';
import AuthService from '@App/services/AuthService.js';
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
    // test('Should throw if Auth0 fails to create user', async () => {
    //   jest
    //   .spyOn(AuthService.prototype, 'createUser')
    //   .mockImplementation(() => Promise.reject(new Error('The user already exists.')));

    //   const mockResolved = {
    //     id: 1,
    //     auth0Id: 'auth0|123456789',
    //     name: 'Bob Boberson',
    //     email: 'bboberson@gmail.com',
    //     preferredContact: 'sms',
    //     searchStatus: 'active',
    //     phone: '123-456-7777',
    //     pronoun: 'them/they',
    //     acceptedTerms: new Date('2021-04-01'),
    //     acceptedPrivacy: new Date('2021-04-01'),
    //   };
    //   mockCtx.prisma.applicant.create.mockResolvedValue(mockResolved);
    //   const applicantController = new ApplicantController(
    //     new AuthService(),
    //     ctx.prisma,
    //   );
    //   await expect(applicantController.createApplicant(
    //     {
    //       name: 'Bob Boberson',
    //       email: 'bboerson@schmidtfutures.com',
    //       preferredContact: 'email',
    //       searchStatus: 'active',
    //       acceptedTerms: true,
    //       acceptedPrivacy: true,
    //     })
    //   ).rejects.toHaveProperty(
    //     'problem.detail',
    //     'User already exists',
    //   );
    // });
    test('Should throw error if Prisma fails to create applicant', async () => {
      mockCtx.prisma.applicant.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('ERROR', {
          code: '101',
          clientVersion: '1.0',
        }),
      );
      const applicantController = new ApplicantController(
        new AuthService(),
        ctx.prisma,
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
        'Database error encountered when creating new user',
      );
    });
  });
});
