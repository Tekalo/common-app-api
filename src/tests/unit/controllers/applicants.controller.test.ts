import ApplicantController from '@App/controllers/ApplicantController.js';
import AuthService from '@App/services/AuthService.js';
import { ZodError } from 'zod';
import { jest } from '@jest/globals';

describe('Applicant Controller', () => {
  describe('Create Applicant', () => {
    const mockAuthService = new AuthService();
    const mockCreateApplicant = jest.fn<typeof mockAuthService.createUser>();

    mockAuthService.createUser = mockCreateApplicant;
    test('Should not store new applicant in Auth0', async () => {
      const applicantController = new ApplicantController(mockAuthService);
      await applicantController.createApplicant(
        {
          name: 'Bob Boberson',
          email: 'bboerson@schmidtfutures.com',
        },
        { auth0: 'false' },
      );
      expect(mockCreateApplicant).toHaveBeenCalledTimes(0);
    });
    test('Should throw error if request body is missing name', async () => {
      const applicantController = new ApplicantController(mockAuthService);
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await applicantController.createApplicant({
          email: 'bboberson@schmidtfutures.com',
        });
      } catch (e) {
        if (!(e instanceof ZodError)) {
          throw new Error('Exepcted ZodError');
        }
      }
    });
  });
});
