import ApplicantController from '@App/controllers/ApplicantController.js';
import AuthService from '@App/services/AuthService.js';
import DummyAuthService from '@App/tests/fixtures/DummyAuthService.js';
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
    // TODO: Flesh me out
    // });
    test('Should throw error if Prisma fails to create applicant', async () => {
      mockCtx.prisma.applicant.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('ERROR', {
          code: '101',
          clientVersion: '1.0',
        }),
      );
      const applicantController = new ApplicantController(
        new DummyAuthService(),
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
