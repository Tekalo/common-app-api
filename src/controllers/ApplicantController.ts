import { Applicant, Prisma, PrismaClient, UploadStatus } from '@prisma/client';
import { AuthResult } from 'express-oauth2-jwt-bearer';
import { AppMetadata, User, UserMetadata } from 'auth0';
import {
  ApplicantResponseBody,
  ApplicantRequestBody,
  ApplicantUpdateBody,
  PrismaApplicantSubmissionWithResume,
  PrismaApplicantDraftSubmissionWithResume,
  ApplicantCreateSubmissionResponse,
  ApplicantGetSubmissionResponse,
  ApplicantDraftSubmissionResponseBody,
  ParsedApplicantUpdateSubmissionBody,
  ParsedApplicantDraftSubmissionBody,
  ParsedApplicantSubmissionBody,
  RawApplicantDraftSubmissionBody,
  RawApplicantSubmissionBody,
} from '@App/resources/types/applicants.js';
import {
  UploadResponseBody,
  UploadRequestBody,
  UploadStateResponseBody,
} from '@App/resources/types/uploads.js';
import AuthService from '@App/services/AuthService.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import EmailService from '@App/services/EmailService.js';
import MonitoringService from '@App/services/MonitoringService.js';
import UploadService from '@App/services/UploadService.js';
import { Claims } from '@App/resources/types/auth0.js';
import { Applicants } from '@capp/schemas';
import { z } from 'zod';

class ApplicantController {
  private auth0Service: AuthService;

  private prisma: PrismaClient;

  private emailService: EmailService;

  private uploadService: UploadService;

  constructor(
    auth0Service: AuthService,
    prisma: PrismaClient,
    emailService: EmailService,
    uploadService: UploadService,
  ) {
    this.auth0Service = auth0Service;
    this.prisma = prisma;
    this.emailService = emailService;
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
      auth0User = await this.auth0Service.createUser({
        name: data.name,
        email: data.email,
      });
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
          utmParams: data.utmParams
            ? {
                create: {
                  params: data.utmParams,
                  event: 'create-applicant',
                },
              }
            : undefined,
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
        // P2002 indicates unique constraint failed(in our case, either email or auth0id)
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
      }
      throw e;
    }
  }

  async createSubmission(
    applicantId: number,
    data: ParsedApplicantSubmissionBody,
  ): Promise<ApplicantCreateSubmissionResponse> {
    /**
     *
     * @param applicantId
     * @param submission
     * @param schema
     * @returns
     */
    const validatedSubmission = await this.validateApplicantSubmission(
      applicantId,
      data,
      Applicants.ApplicantCreateSubmissionRequestBodySchema,
    );
    const applicantSubmission = await this.prisma.applicantSubmission.create({
      data: {
        ...validatedSubmission,
        resumeUpload: { connect: { id: validatedSubmission.resumeUpload.id } },
        applicant: { connect: { id: applicantId } },
        utmParams: validatedSubmission.utmParams
          ? {
              create: {
                params: validatedSubmission.utmParams,
                event: 'create-submission',
              },
            }
          : undefined,
      },
      include: {
        resumeUpload: { select: { id: true, originalFilename: true } },
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
    // Remove resumeUploadId from response
    const { resumeUploadId, ...submissionVals } = applicantSubmission;
    return Applicants.ApplicantCreateSubmissionResponseBodySchema.parse({
      submission: submissionVals,
      isFinal: true,
    });
  }

  async updateSubmission(
    applicantId: number,
    data: ParsedApplicantUpdateSubmissionBody,
  ): Promise<ApplicantCreateSubmissionResponse> {
    /**
     *
     * @param applicantId
     * @param submission
     * @param schema
     * @returns
     */
    const validatedSubmission = await this.validateApplicantSubmission(
      applicantId,
      data,
      Applicants.ApplicantCreateSubmissionRequestBodySchema,
    );
    const { resumeUpload, ...restOfSubmission } = validatedSubmission;
    // Throws error if applicantID doesn't exist
    const applicantSubmission = await this.prisma.applicantSubmission.update({
      data: {
        ...restOfSubmission,
        resumeUpload: {
          connect: { id: resumeUpload.id },
        },
      },
      include: {
        resumeUpload: { select: { id: true, originalFilename: true } },
      },
      where: { applicantId },
    });
    const { resumeUploadId, ...submissionVals } = applicantSubmission;
    return Applicants.ApplicantCreateSubmissionResponseBodySchema.parse({
      submission: submissionVals,
      isFinal: true,
    });
  }

  async pauseApplicant(applicantId: number, pauseStatus: boolean) {
    try {
      const { id, isPaused } = await this.prisma.applicant.update({
        data: { isPaused: pauseStatus },
        where: { id: applicantId },
      });
      return { id, isPaused };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new CAPPError(
          {
            title: 'Applicant not found',
            detail: 'Database error encountered when pausing applicant status',
            status: 404,
          },
          e instanceof Error ? { cause: e } : undefined,
        );
      }
      throw e;
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
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new CAPPError(
          {
            title: 'Applicant Update Error',
            detail: 'Applicant not found',
            status: 404,
          },
          e instanceof Error ? { cause: e } : undefined,
        );
      }
      throw e;
    }
  }

  async deleteApplicant(applicantId: number) {
    const applicantToDelete = await this.prisma.applicant.findUniqueOrThrow({
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
    const applicantToDelete = await this.prisma.applicant.findUniqueOrThrow({
      where: { id: applicantId },
    });
    // Delete from applicant table
    await this.prisma.applicant.delete({ where: { id: applicantId } });
    const { email, auth0Id } = applicantToDelete;
    await this.auth0Service.deleteUsers(email, auth0Id);
    await this.uploadService.deleteApplicantResumes(applicantId);
    return { id: applicantId };
  }

  async validResume(
    submission:
      | ParsedApplicantSubmissionBody
      | ParsedApplicantDraftSubmissionBody,
    applicantId: number,
  ) {
    if (submission.resumeUpload) {
      const resume = await this.uploadService.getApplicantUpload(
        applicantId,
        submission.resumeUpload.id,
      );
      return !!(resume && resume.status === 'SUCCESS');
    }
    return true;
  }

  /**
   * Adds any application-level logic for validating draft or final submission data
   * @param applicantId
   * @param submission
   * @param schema Zod Schema to use for parsing submission data
   * @returns validated final or draft submission
   */
  async validateApplicantSubmission<
    T extends
      | ParsedApplicantSubmissionBody
      | ParsedApplicantDraftSubmissionBody,
  >(
    applicantId: number,
    submission: T,
    schema: z.ZodType<
      T,
      z.ZodTypeDef,
      RawApplicantSubmissionBody | RawApplicantDraftSubmissionBody
    >,
  ): Promise<T> {
    const refinement = schema.superRefine(
      async (unvalidatedSubmission, ctx) => {
        const validResume = await this.validResume(
          unvalidatedSubmission,
          applicantId,
        );
        if (!validResume) {
          ctx.addIssue({
            message: 'Invalid resume',
            code: z.ZodIssueCode.custom,
            path: ['resumeUpload.id'],
          });
        }
      },
    );
    const parsedSubmission = await refinement.parseAsync(submission);
    return parsedSubmission;
  }

  async createOrUpdateDraftSubmission(
    applicantId: number,
    data: ParsedApplicantDraftSubmissionBody,
  ): Promise<ApplicantDraftSubmissionResponseBody> {
    /**
     *
     * @param applicantId
     * @param submission
     * @param schema
     * @returns
     */
    const validatedSubmission = await this.validateApplicantSubmission(
      applicantId,
      data,
      Applicants.ApplicantDraftSubmissionRequestBodySchema,
    );
    const { resumeUpload, ...restOfSubmission } = validatedSubmission;
    const draftSubmission = await this.prisma.applicantDraftSubmission.upsert({
      create: {
        ...restOfSubmission,
        resumeUpload: resumeUpload
          ? {
              connect: { id: resumeUpload?.id },
            }
          : undefined,
        applicant: { connect: { id: applicantId } },
        utmParams: data.utmParams
          ? {
              create: {
                params: data.utmParams,
                event: 'create-draft-submission',
              },
            }
          : undefined,
      },
      update: {
        ...restOfSubmission,
        resumeUpload: resumeUpload
          ? { connect: { id: resumeUpload.id } }
          : { disconnect: true },
        utmParams: undefined, // we never want to update utmParams on draft update
      },
      include: {
        resumeUpload: { select: { id: true, originalFilename: true } },
      },
      where: { applicantId },
    });
    // remove resumeUploadId from response
    const { resumeUploadId, ...draftSubmissionVals } = draftSubmission;
    return { submission: draftSubmissionVals, isFinal: false };
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
    const submission = await this.prisma.applicantSubmission.findFirst({
      where: {
        applicantId,
        resumeUpload: {
          status: 'SUCCESS',
        },
      },
      select: { resumeUpload: true },
    });
    if (!submission || !submission.resumeUpload) {
      throw new CAPPError({
        title: 'Not Found',
        detail: 'Resume not found',
        status: 404,
      });
    }
    const url = await this.uploadService.generateSignedResumeDownloadUrl(
      applicantId,
      submission.resumeUpload.id,
      submission.resumeUpload.contentType,
    );
    return url;
  }
}

export default ApplicantController;
