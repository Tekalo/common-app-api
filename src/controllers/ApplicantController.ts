import {
  ApplicantResponseBody,
  ApplicantRequestBody,
  ApplicantSubmissionBody,
  ApplicantDraftSubmissionBody,
} from '@App/resources/types/applicants.js';
import {
  Applicant,
  ApplicantDraftSubmission,
  ApplicantSubmission,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import AuthService from '@App/services/AuthService.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import { Problem } from '@App/resources/types/shared.js';
import EmailService from '@App/services/EmailService.js';
import MonitoringService from '@App/services/MonitoringService.js';
import { AuthResult } from 'express-oauth2-jwt-bearer';
import { Claims } from '@App/resources/types/auth0.js';
import { AppMetadata, User, UserMetadata } from 'auth0';

class ApplicantController {
  private auth0Service: AuthService;

  private prisma: PrismaClient;

  private emailService: EmailService;

  private monitoringService: MonitoringService;

  constructor(
    auth0Service: AuthService,
    prisma: PrismaClient,
    emailService: EmailService,
    monitoringService: MonitoringService,
  ) {
    this.auth0Service = auth0Service;
    this.prisma = prisma;
    this.emailService = emailService;
    this.monitoringService = monitoringService;
  }

  async createApplicant(
    data: ApplicantRequestBody,
    auth?: AuthResult,
  ): Promise<ApplicantResponseBody> {
    let auth0UserId;
    let returnApplicant: Applicant;
    // If our request already has a JWT, user must have signed up with social/password before registering.
    // Ensure registration email matches auth0 email
    if (auth) {
      const auth0RegisteredEmail = auth.payload[Claims.email];
      if (!auth0RegisteredEmail || auth0RegisteredEmail !== data.email) {
        throw new CAPPError({
          title: 'Auth0 User Creation Error',
          detail: 'Invalid email provided',
          status: 400,
        });
      }
      auth0UserId = auth.payload.sub;
    } else {
      let auth0User: User<AppMetadata, UserMetadata> | undefined;
      try {
        auth0User = await this.auth0Service.createUser({
          name: data.name,
          email: data.email,
        });
      } catch (e) {
        // If our user is not coming in with a JWT, but they already exist in Auth0, they need to make this request with their JWT
        if (e instanceof CAPPError && e.problem.status === 409) {
          const userExists = await this.auth0Service.userExists(data.email);
          if (userExists) {
            throw new CAPPError(
              {
                title: 'Auth0 User Exists',
                detail: 'User must login',
                status: 401,
              },
              e instanceof Error ? { cause: e } : undefined,
            );
          } else {
            // User exists in Auth0, but something unknown went wrong in fetching them
            throw new CAPPError(
              {
                title: 'Auth0 User Exists',
                detail: 'Failed to find existing user',
                status: 404,
              },
              e instanceof Error ? { cause: e } : undefined,
            );
          }
        } else {
          throw e;
        }
      }
      auth0UserId = auth0User?.user_id;
    }
    if (!auth0UserId) {
      throw new CAPPError({
        title: 'Auth0 User Error',
        detail: 'Failed to create or retrieve Auth0 user',
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
          auth0Id: auth0UserId,
        },
      });
      try {
        const { ticket } = await this.auth0Service.generatePasswordReset(
          returnApplicant.auth0Id,
        );
        const signInLink: string = AuthService.getSignInLink();

        const welcomeEmail = this.emailService.generateApplicantWelcomeEmail(
          returnApplicant.email,
          ticket,
          signInLink,
        );
        await this.emailService.sendEmail(welcomeEmail);
      } catch (e) {
        MonitoringService.logError(
          new CAPPError(
            { title: 'Failed to send post sign-up set password email' },
            e instanceof Error ? { cause: e } : undefined,
          ),
        );
      }
      return {
        id: returnApplicant.id,
        auth0Id: auth0UserId || null,
        email: returnApplicant.email,
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002 indicates unique constraint failed (in our case, either email or auth0id)
        if (e.code === 'P2002') {
          throw new CAPPError(
            {
              title: 'User Creation Error',
              detail: 'User already exists',
              status: 409,
            },
            e instanceof Error ? { cause: e } : undefined,
          );
        }
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
      const applicantSubmission = await this.prisma.applicantSubmission.create({
        data: {
          ...data,
          otherCauses: data.otherCauses ? data.otherCauses : [],
          applicantId,
        },
      });

      try {
        const applicant = await this.prisma.applicant.findUniqueOrThrow({
          where: { id: applicantId },
        });
        const submissionEmail =
          this.emailService.generateApplicantPostSubmitEmail(applicant.email);
        await this.emailService.sendEmail(submissionEmail);
      } catch (e) {
        MonitoringService.logError(
          new CAPPError(
            { title: 'Failed to send applicant post-submission email' },
            e instanceof Error ? { cause: e } : undefined,
          ),
        );
      }
      return applicantSubmission;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
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
        if (e.code === 'P2001') {
          problem.detail = 'Applicant not found';
          problem.status = 404;
        }
        throw new CAPPError(
          problem,
          e instanceof Error ? { cause: e } : undefined,
        );
      }
      throw new CAPPError(
        {
          title: 'Applicant Pause Error',
          detail: 'Error when pausing applicant status',
        },
        e instanceof Error ? { cause: e } : undefined,
      );
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
            acceptedTerms: applicantToDelete.acceptedTerms,
            acceptedPrivacy: applicantToDelete.acceptedPrivacy,
            followUpOptIn: applicantToDelete.followUpOptIn,
          },
        }),
        // Delete from applicant table
        this.prisma.applicant.delete({ where: { id: applicantId } }),
      ]);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
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
          detail: 'Error when deleting applicant',
        },
        e instanceof Error ? { cause: e } : undefined,
      );
    }
    await this.auth0Service.deleteUser(applicantToDelete.auth0Id);
    const deletionEmail = this.emailService.generateApplicantDeletionEmail(
      applicantToDelete.email,
      applicantToDelete.name,
    );
    await this.emailService.sendEmail(deletionEmail);
    return { id: applicantId };
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

  async getMySubmissions(id: number) {
    let submission: ApplicantDraftSubmission | ApplicantSubmission | null;
    let isFinal = false;
    try {
      submission = await this.prisma.applicantSubmission.findFirst({
        where: { applicantId: id },
      });

      if (submission) {
        isFinal = true;
      } else {
        submission = await this.prisma.applicantDraftSubmission.findFirst({
          where: { applicantId: id },
        });
      }
      return { isFinal, submission };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CAPPError(
          {
            title: 'Applicant Submissions Retrieval Error',
            detail: 'Could not find applicant submissions',
            status: 404,
          },
          e instanceof Error ? { cause: e } : undefined,
        );
      }
      throw new CAPPError(
        {
          title: 'Applicant Submissions Retrieval Error',
          detail: "Error when retrieving applicant's submission",
        },
        e instanceof Error ? { cause: e } : undefined,
      );
    }
  }

  async getApplicant(id: number) {
    try {
      const { name, email, isPaused } =
        await this.prisma.applicant.findFirstOrThrow({
          where: { id },
        });
      return { id, name, email, isPaused };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CAPPError(
          {
            title: 'Applicant Retrieval Error',
            detail: 'Could not find applicant',
            status: 404,
          },
          e instanceof Error ? { cause: e } : undefined,
        );
      }
      throw new CAPPError(
        {
          title: 'Applicant Retrieval Error',
          detail: 'Error retrieving applicant info',
        },
        e instanceof Error ? { cause: e } : undefined,
      );
    }
  }
}

export default ApplicantController;
