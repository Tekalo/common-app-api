import {
  Applicant,
  ApplicantDraftSubmission,
  Prisma,
  PrismaClient,
  UploadStatus,
} from '@prisma/client';
import { AuthResult } from 'express-oauth2-jwt-bearer';
import { AppMetadata, User, UserMetadata } from 'auth0';
import {
  ApplicantResponseBody,
  ApplicantRequestBody,
  ApplicantSubmissionBody,
  ApplicantDraftSubmissionBody,
  ApplicantUpdateBody,
  PrismaApplicantSubmissionWithResume,
  PrismaApplicantDraftSubmissionWithResume,
  ApplicantCreateSubmissionResponse,
  ApplicantGetSubmissionResponse,
} from '@App/resources/types/applicants.js';
import {
  UploadResponseBody,
  UploadRequestBody,
  UploadStateResponseBody,
} from '@App/resources/types/uploads.js';
import AuthService from '@App/services/AuthService.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import { Problem } from '@App/resources/types/shared.js';
import EmailService from '@App/services/EmailService.js';
import MonitoringService from '@App/services/MonitoringService.js';
import UploadService from '@App/services/UploadService.js';
import { Claims } from '@App/resources/types/auth0.js';

class ApplicantController {
  private auth0Service: AuthService;

  private prisma: PrismaClient;

  private emailService: EmailService;

  private monitoringService: MonitoringService;

  private uploadService: UploadService;

  constructor(
    auth0Service: AuthService,
    prisma: PrismaClient,
    emailService: EmailService,
    monitoringService: MonitoringService,
    uploadService: UploadService,
  ) {
    this.auth0Service = auth0Service;
    this.prisma = prisma;
    this.emailService = emailService;
    this.monitoringService = monitoringService;
    this.uploadService = uploadService;
  }

  async createApplicant(
    data: ApplicantRequestBody,
    auth?: AuthResult,
  ): Promise<ApplicantResponseBody> {
    let auth0UserId;
    let auth0User: User<AppMetadata, UserMetadata> | undefined;
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
      const userExists = await this.auth0Service.userExists(data.email);
      // If our user is not coming in with a JWT, but they already exist in Auth0, they need to make this request with their JWT aka "login"
      if (userExists) {
        throw new CAPPError({
          title: 'Auth0 User Exists',
          detail: 'User must login',
          status: 409,
        });
      }
      try {
        auth0User = await this.auth0Service.createUser({
          name: data.name,
          email: data.email,
        });
      } catch (e) {
        throw new CAPPError(
          {
            title: 'Auth0 User Exists',
            detail: 'Something went wrong in creating user',
            status: 500,
          },
          e instanceof Error ? { cause: e } : undefined,
        );
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
      // Do not sent a welcome email if our user has a valid JWT.
      // A valid JWT at this stage means they are authenticated with social login.
      if (!auth) {
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
  ): Promise<ApplicantCreateSubmissionResponse> {
    const {
      openToRemote,
      openToRemoteMulti,
      otherCauses,
      resumeUpload,
      ...restOfSubmission
    } = data;
    // Make sure the specified resume upload belongs to the authed user. If not, throw CAPPError.
    if (resumeUpload) {
      await this.validateResumeUpload(applicantId, resumeUpload.id);
    }
    try {
      const applicantSubmission = await this.prisma.applicantSubmission.create({
        data: {
          ...restOfSubmission,
          openToRemoteMulti: openToRemoteMulti || openToRemote,
          otherCauses: otherCauses || [],
          resumeUploadId: resumeUpload?.id,
          applicantId,
        },
        include: {
          resumeUpload: { select: { id: true, originalFilename: true } },
        },
      });
      // remove resumeUploadId from response
      const { resumeUploadId, ...submissionVals } = applicantSubmission;
      const returnApplicantSubmission: ApplicantCreateSubmissionResponse =
        submissionVals;

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
      return returnApplicantSubmission;
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
        if (e.code === 'P2025') {
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

  async updateApplicantAuth0Id(
    prevAuth0Id: string,
    updateBody: ApplicantUpdateBody,
  ) {
    try {
      const { auth0Id: newAuth0Id } = updateBody;
      const applicant = await this.prisma.applicant.update({
        data: { auth0Id: newAuth0Id },
        where: { auth0Id: prevAuth0Id },
      });
      return applicant;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        const problem: Problem = {
          title: 'Applicant Update Error',
          detail: 'Database error encountered when updating applicant',
          status: 400,
        };
        if (e.code === 'P2025') {
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
          title: 'Applicant Update Error',
          detail: 'Error when updating applicant',
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
    const { email, auth0Id } = applicantToDelete;
    await this.auth0Service.deleteUsers(email, auth0Id);

    await this.uploadService.deleteApplicantResumes(applicantId);
    const deletionEmail = this.emailService.generateApplicantDeletionEmail(
      applicantToDelete.email,
      applicantToDelete.name,
    );
    await this.emailService.sendEmail(deletionEmail);
    return { id: applicantId };
  }

  // Deletes applicants who have no registration or application data from Auth0
  // and sends deletion complete email
  async deleteAuth0OnlyApplicant(auth0Id: string) {
    const applicantToDelete = await this.auth0Service.getUser(auth0Id);

    // Create deletion request
    try {
      const neverDate = new Date('2000-01-01');
      await this.prisma.applicantDeletionRequests.create({
        data: {
          email: applicantToDelete.email || auth0Id,
          applicantId: 0,
          acceptedTerms: neverDate,
          acceptedPrivacy: neverDate,
          followUpOptIn: false,
        },
      });
    } catch (e) {
      throw new CAPPError(
        {
          title: 'Applicant Deletion Error',
          detail: `Unable to create applicant deletion request for Auth0 User ${auth0Id}`,
        },
        e instanceof Error ? { cause: e } : undefined,
      );
    }

    if (applicantToDelete?.email) {
      const { email } = applicantToDelete;
      await this.auth0Service.deleteUsers(email, auth0Id);
      const deletionEmail =
        this.emailService.generateApplicantDeletionCompleteEmail(
          applicantToDelete.email,
          applicantToDelete.name || 'Applicant',
        );
      await this.emailService.sendEmail(deletionEmail);
    }
    return { auth0Id };
  }

  // Deletes specified applicant without making deletion request entry or sending emails
  // Meant to be used by E2E tests and admins
  async deleteApplicantForce(applicantId: number) {
    let applicantToDelete;
    try {
      applicantToDelete = await this.prisma.applicant.findUniqueOrThrow({
        where: { id: applicantId },
      });
      // Delete from applicant table
      await this.prisma.applicant.delete({ where: { id: applicantId } });
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
    const { email, auth0Id } = applicantToDelete;
    await this.auth0Service.deleteUsers(email, auth0Id);
    await this.uploadService.deleteApplicantResumes(applicantId);
    return { id: applicantId };
  }

  async validateResumeUpload(applicantId: number, resumeUploadId: number) {
    try {
      const resume = await this.uploadService.getApplicantUploadOrThrow(
        applicantId,
        resumeUploadId,
      );
      if (resume.status !== 'SUCCESS') {
        throw new CAPPError({
          title: 'Upload Error',
          detail: "Upload status must be 'SUCCESS'",
          status: 400,
        });
      }
    } catch (e) {
      throw new CAPPError(
        {
          title: 'Applicant Submission Creation Error',
          detail: 'Invalid upload provided',
          status: 400,
        },
        e instanceof Error ? { cause: e } : undefined,
      );
    }
  }

  async createOrUpdateDraftSubmission(
    applicantId: number,
    data: ApplicantDraftSubmissionBody,
  ): Promise<ApplicantDraftSubmission> {
    const {
      openToRemote,
      openToRemoteMulti,
      otherCauses,
      resumeUpload,
      ...restOfSubmission
    } = data;
    if (resumeUpload) {
      await this.validateResumeUpload(applicantId, resumeUpload.id);
    }
    try {
      // TODO: Remove support for openToRemote
      return await this.prisma.applicantDraftSubmission.upsert({
        create: {
          ...restOfSubmission,
          openToRemoteMulti: openToRemoteMulti || openToRemote || undefined,
          otherCauses: otherCauses || [],
          resumeUploadId: resumeUpload?.id,
          applicantId,
        },
        update: {
          ...restOfSubmission,
          openToRemoteMulti: openToRemoteMulti || openToRemote || undefined,
          otherCauses: otherCauses || [],
        },
        include: {
          resumeUpload: { select: { id: true, originalFilename: true } },
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

  async getMySubmissions(id: number): Promise<ApplicantGetSubmissionResponse> {
    let submission:
      | PrismaApplicantSubmissionWithResume
      | PrismaApplicantDraftSubmissionWithResume
      | null;
    let isFinal = false;
    try {
      submission = await this.prisma.applicantSubmission.findFirst({
        where: { applicantId: id },
        include: {
          resumeUpload: { select: { id: true, originalFilename: true } },
        },
      });

      if (submission) {
        isFinal = true;
      } else {
        submission = await this.prisma.applicantDraftSubmission.findFirst({
          where: { applicantId: id },
          include: {
            resumeUpload: { select: { id: true, originalFilename: true } },
          },
        });
      }

      if (!submission) {
        return { isFinal: false, submission: null };
      }
      const { resumeUploadId, ...submissionVals } = submission;

      return {
        isFinal,
        submission: submissionVals,
      };
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

  async updateUploadStatus(
    applicantId: number,
    uploadId: number,
    status: UploadStatus,
  ): Promise<UploadStateResponseBody> {
    try {
      const uploadUpdate = await this.prisma.upload.update({
        where: {
          id: uploadId,
          applicantId,
          NOT: {
            status: 'SUCCESS',
          },
        },
        data: { status },
      });
      return {
        id: uploadUpdate.id,
        originalFilename: uploadUpdate.originalFilename,
        status: uploadUpdate.status,
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CAPPError(
          {
            title: 'Upload update error',
            detail: 'Invalid input',
            status: 400,
          },
          e instanceof Error ? { cause: e } : undefined,
        );
      }
      throw new CAPPError(
        {
          title: 'Upload update error',
          detail: 'Could not update upload status',
          status: 500,
        },
        e instanceof Error ? { cause: e } : undefined,
      );
    }
  }

  async getResumeUploadUrl(
    applicantId: number,
    data: UploadRequestBody,
  ): Promise<UploadResponseBody> {
    // create record in db
    // use s3 service to generate a url
    const resumeUrlResponse =
      await this.uploadService.generateSignedResumeUploadUrl(
        applicantId,
        data.originalFilename,
        data.contentType,
      );
    return resumeUrlResponse;
  }

  async getResumeDownloadUrl(applicantId: number): Promise<UploadResponseBody> {
    const resume = await this.prisma.upload.findFirst({
      where: {
        applicantId,
        type: 'RESUME',
        status: 'SUCCESS',
      },
    });
    if (!resume) {
      throw new CAPPError({
        title: 'Not Found',
        detail: 'Resume not found',
        status: 404,
      });
    }
    const url = await this.uploadService.generateSignedResumeDownloadUrl(
      applicantId,
      resume.id,
      resume.contentType,
    );
    return url;
  }
}

export default ApplicantController;
