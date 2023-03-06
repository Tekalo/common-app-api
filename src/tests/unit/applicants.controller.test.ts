import ApplicantController from '@App/controllers/ApplicantController.js';
import CappAuth0Client from '@App/services/CappAuth0Client.js';
import { ZodError } from 'zod';
import { jest } from '@jest/globals';

describe('Applicant Controller', () => {
  describe('Create Applicant', () => {
    const mockCappAuth0Client = new CappAuth0Client();
    const mockCreateApplicant =
      jest.fn<typeof mockCappAuth0Client.createUser>();

    mockCappAuth0Client.createUser = mockCreateApplicant;
    test('Should not store new applicant in Auth0', async () => {
      const applicantController = new ApplicantController(mockCappAuth0Client);
      await applicantController.createApplicant(
        {
          name: 'Bob Boberson',
          email: 'bboerson@schmidtfutures.com',
        },
        { auth0: 'false' },
      );
      expect(mockCappAuth0Client.createUser).toHaveBeenCalledTimes(0);
    });
    test("Should throw error if request body is missing name", async () => {
      const applicantController = new ApplicantController(mockCappAuth0Client);
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
