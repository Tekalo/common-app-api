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
  });
});
