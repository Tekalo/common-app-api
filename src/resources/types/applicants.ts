import { ApplicantSubmission, ApplicantDraftSubmission } from '@prisma/client';
import { z } from 'zod';
import { Applicants } from '@capp/schemas';

export type ApplicantRequestBody = z.infer<
  typeof Applicants.ApplicantRequestBodySchema
>;

export type ApplicantUpdateSubmissionBodyInput = z.input<
  typeof Applicants.ApplicantUpdateSubmissionRequestBodySchema
>;

export type ApplicantUpdateSubmissionBodyOutput = z.output<
  typeof Applicants.ApplicantUpdateSubmissionRequestBodySchema
>;

export type ApplicantDraftSubmissionBodyInput = z.input<
  typeof Applicants.ApplicantDraftSubmissionRequestBodySchema
>;

export type ApplicantDraftSubmissionBodyOutput = z.output<
  typeof Applicants.ApplicantDraftSubmissionRequestBodySchema
>;

export type ApplicantDraftSubmissionResponseBody = z.infer<
  typeof Applicants.ApplicantDraftSubmissionResponseBodySchema
>;

export type ApplicantSubmissionBodyInput = z.input<
  typeof Applicants.ApplicantCreateSubmissionRequestBodySchema
>;

export type ApplicantSubmissionBodyOutput = z.output<
  typeof Applicants.ApplicantCreateSubmissionRequestBodySchema
>;

export type ApplicantUpdateBody = z.infer<
  typeof Applicants.ApplicantUpdateRequestBodySchema
>;

export type ApplicantResponseBody = z.infer<
  typeof Applicants.ApplicantResponseBodySchema
>;

export type ApplicantStateBody = z.infer<
  typeof Applicants.ApplicantStateRequestBodySchema
>;

export type ResumeUpload = {
  resumeUpload: null | {
    id: number;
    originalFilename: string;
  };
};

export type ApplicantCreateSubmissionResponse = z.infer<
  typeof Applicants.ApplicantCreateSubmissionResponseBodySchema
>;

export type ApplicantGetSubmissionResponse = z.infer<
  typeof Applicants.ApplicantGetSubmissionsResponseBodySchema
>;

// Custom type to represent Prisma query on ApplicantSubmission with a JOIN on Upload table
export type PrismaApplicantSubmissionWithResume = ApplicantSubmission &
  ResumeUpload;
export type PrismaApplicantDraftSubmissionWithResume =
  ApplicantDraftSubmission & ResumeUpload;
