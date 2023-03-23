import {
  ApplicantQueryParams,
  ApplicantResponseBody,
  ApplicantRequestBody,
} from '@App/resources/types/applicants.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import { Prisma, PrismaClient } from '@prisma/client';
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
    query: ApplicantQueryParams = { auth0: 'true' },
  ): Promise<ApplicantResponseBody> {
    let auth0User;
    if (query.auth0 !== 'false') {
      // Throws error if there is any issue with user creation
      auth0User = await this.auth0Service.createUser({
        name: data.name,
        email: data.email,
      });
    }
    let returnApplicant;
    try {
      const applicantData = auth0User
        ? { ...data, auth0Id: auth0User.user_id }
        : data;
      // TODO: If this fails, we want to remove user from Auth0.
      // We can't "rollback" Auth0 operation, but maybe we manually delete or try to delete here?
      returnApplicant = await this.prisma.applicant.create({
        data: applicantData,
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

  async deleteApplicant(id: string) {
    try {
      // TODO:
      // await this.prisma.applicant.delete({ where: { auth0Id: id } });
      // await this.auth0Service.deleteUser( id );
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // TODO : Log e.message in Sentry
        throw new CAPPError(
          {
            title: 'Applicant Deletion Error',
            detail: 'Database error encountered when deleting applicant',
            status: 400,
          },
          e instanceof Error ? { cause: e } : undefined,
        );
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
