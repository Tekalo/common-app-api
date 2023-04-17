import {
  ApplicantResponseBody,
  ApplicantRequestBody,
  ApplicantSubmissionBody,
  ApplicantDraftSubmissionBody,
} from '@App/resources/types/applicants.js';
import {
  ApplicantDraftSubmission,
  ApplicantSubmission,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import AuthService from '@App/services/AuthService.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import { Problem } from '@App/resources/types/shared.js';

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
    let returnApplicant;
    const auth0User = await this.auth0Service.createUser({
      name: data.name,
      email: data.email,
    });
    if (!auth0User.user_id) {
      throw new CAPPError({
        title: 'Auth0 User Creation Error',
        detail: 'Failed to create new user in Auth0',
        status: 400,
      });
    }
    try {
      // If DB creation fails, we want to remove user from Auth0.
      // TODO We can't "rollback" Auth0 operation, log in Sentry and trigger alarm/alert to manually delete?
      const { acceptedPrivacy, acceptedTerms, ...prismaData } = data;
      returnApplicant = await this.prisma.applicant.create({
        data: {
          ...prismaData,
          auth0Id: auth0User.user_id,
        },
      });
      return {
        id: returnApplicant.id,
        auth0Id: auth0User.user_id || null,
        email: returnApplicant.email,
      };
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
  }

  async createSubmission(
    applicantId: number,
    data: ApplicantSubmissionBody,
  ): Promise<ApplicantSubmission> {
    try {
      return await this.prisma.applicantSubmission.create({
        data: {
          ...data,
          otherCauses: data.otherCauses ? data.otherCauses : [],
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

  async pauseApplicant(applicantId: number, pauseStatus: boolean) {
    try {
      const { id, isPaused } = await this.prisma.applicant.update({
        data: { isPaused: pauseStatus },
        where: { id: applicantId },
      });
      return { id, isPaused };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        const problem: Problem = {
          title: 'Applicant Pause Error',
          detail: 'Database error encountered when pausing applicant status',
          status: 400,
        };
        if (e.meta?.cause === 'Record to update not found.') {
          problem.status = 404;
        }
        throw new CAPPError(problem);
      }
      throw new CAPPError({
        title: 'Applicant Pause Error',
        detail: 'Error when pausing applicant status',
      });
    }
  }

  async deleteApplicant(applicantId: number) {
    let applicantToDelete;
    try {
      applicantToDelete = await this.prisma.applicant.findUniqueOrThrow({
        where: { id: applicantId },
      });
      await this.prisma.$transaction([
        // Create deletion request
        this.prisma.applicantDeletionRequests.create({
          data: {
            email: applicantToDelete.email,
            applicantId: applicantToDelete.id,
            auth0Id: applicantToDelete.auth0Id,
            acceptedTerms: applicantToDelete.acceptedTerms,
            acceptedPrivacy: applicantToDelete.acceptedPrivacy,
          },
        }),
        // We use deleteMany() as a workaround because delete() throws if there are no submissions
        // TODO: Make sure we should do this (would we need to revert data at any point?)
        // TODO: Delete draft submissions too
        this.prisma.applicantSubmission.deleteMany({ where: { applicantId } }),
        // TODO: Delete any associated draft submissions
        // Delete from applicant table
        this.prisma.applicant.delete({ where: { id: applicantId } }),
      ]);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // TODO : Log e.message in Sentry
        throw new CAPPError({
          title: 'Applicant Deletion Error',
          detail: 'Database error encountered when deleting applicant',
          status: 400,
        });
      }
      throw new CAPPError({
        title: 'Applicant Deletion Error',
        detail: 'Error when deleting applicant',
      });
    }
    await this.auth0Service.deleteUser(applicantToDelete.auth0Id);
  }

  async createOrUpdateDraftSubmission(
    applicantId: number,
    data: ApplicantDraftSubmissionBody,
  ): Promise<ApplicantDraftSubmission> {
    try {
      return await this.prisma.applicantDraftSubmission.upsert({
        create: {
          ...data,
          otherCauses: data.otherCauses ? data.otherCauses : [],
          applicantId,
        },
        update: {
          ...data,
          otherCauses: data.otherCauses ? data.otherCauses : [],
        },
        where: { applicantId },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // TODO : Log e.message in Sentry
        throw new CAPPError(
          {
            title: 'Applicant Draft Submission Creation Error',
            detail:
              'Database error encountered when creating applicant draft submission',
            status: 400,
          },
          e instanceof Error ? { cause: e } : undefined,
        );
      }
      throw new CAPPError(
        {
          title: 'Applicant Draft Submission Creation Error',
          detail: 'Unknown error in creating applicant draft submission',
          status: 500,
        },
        e instanceof Error ? { cause: e } : undefined,
      );
    }
  }
}

export default ApplicantController;
