import {
  ApplicantResponseBody,
  ApplicantRequestBody,
  ApplicantSubmissionBody,
} from '@App/resources/types/applicants.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import { ApplicantSubmission, Prisma, PrismaClient } from '@prisma/client';
import AuthService from '@App/services/AuthService.js';

class ApplicantController {
  private auth0Service: AuthService;

  private prisma: PrismaClient;

  constructor(auth0Service: AuthService, prisma: PrismaClient) {
    this.auth0Service = auth0Service;
    this.prisma = prisma;
  }

  async createApplicant(
    data: ApplicantRequestBody,
  ): Promise<ApplicantResponseBody> {
    const auth0User = await this.auth0Service.createUser({
      name: data.name,
      email: data.email,
    });
    let returnApplicant;
    try {
      // TODO: If this fails, we want to remove user from Auth0.
      // We can't "rollback" Auth0 operation, but maybe we manually delete or try to delete here?
      const { acceptedPrivacy, acceptedTerms, ...prismaData } = data;
      returnApplicant = await this.prisma.applicant.create({
        data: prismaData,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // TODO : Log e.message in Sentry
        throw new CAPPError(
          {
            title: 'User Creation Error',
            detail: 'Database error encountered when creating new user',
            status: 400,
          },
          e instanceof Error ? { cause: e } : undefined,
        );
      }
      throw new CAPPError(
        {
          title: 'User Creation Error',
          detail: 'Unknown error in creating applicant',
          status: 500,
        },
        e instanceof Error ? { cause: e } : undefined,
      );
    }
    return {
      id: returnApplicant.id,
      auth0Id: auth0User?.user_id || null,
      email: returnApplicant.email,
    };
  }

  async createSubmission(
    applicantId: number,
    data: ApplicantSubmissionBody,
  ): Promise<ApplicantSubmission> {
    try {
      return await this.prisma.applicantSubmission.create({
        data: {
          ...data,
          applicantId,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // TODO : Log e.message in Sentry
        throw new CAPPError(
          {
            title: 'Applicant Submission Creation Error',
            detail:
              'Database error encountered when creating applicant submission',

            status: 400,
          },
          e instanceof Error ? { cause: e } : undefined,
        );
      }
      throw new CAPPError(
        {
          title: 'Applicant Submission Creation Error',
          detail: 'Unknown error in creating applicant submission',
          status: 500,
        },
        e instanceof Error ? { cause: e } : undefined,
      );
    }
  }

  // our applicant ID
  async deleteApplicant(id: number) {
    try {
      // TODO:
      const applicantToDelete = await this.prisma.applicant.findUniqueOrThrow({
        where: { id },
      });
      await this.prisma.applicantDeletionRequests.create({
        data: {
          email: applicantToDelete.email,
          auth0Id: applicantToDelete.auth0Id || '',
        },
      });
      await this.prisma.applicant.delete({ where: { id } });
      await this.auth0Service.deleteUser(applicantToDelete.auth0Id);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // TODO : Log e.message in Sentry
        throw new CAPPError({
          title: 'Applicant Deletion Error',
          detail: 'Database error encountered when deleting applicant',
        });
      }
      throw new CAPPError(
        {
          title: 'Applicant Deletion Error',
          detail: 'Unknown error when deleting applicant',

          status: 500,
        },
        e instanceof Error ? { cause: e } : undefined,
      );
    }
  }
}

export default ApplicantController;
