import { ApplicantSubmission, ApplicantDraftSubmission } from '@prisma/client';
import { z } from 'zod';
import { Applicants } from '@capp/schemas';

/**
 * Types prefixed with "Raw" are schemas before being parsed by Zod
 * Types prefixed with "Parsed" are schemas after being parsed by Zod
 */

export type ApplicantRequestBody = z.infer<
  typeof Applicants.ApplicantCreateRequestBodySchema
>;

export type RawApplicantUpdateSubmission = z.input<
  typeof Applicants.ApplicantUpdateSubmissionRequestBodySchema
>;

export type ParsedApplicantUpdateSubmissionBody = z.output<
  typeof Applicants.ApplicantUpdateSubmissionRequestBodySchema
>;

export type RawApplicantDraftSubmissionBody = z.input<
  typeof Applicants.ApplicantDraftSubmissionRequestBodySchema
>;

export type ParsedApplicantDraftSubmissionBody = z.output<
  typeof Applicants.ApplicantDraftSubmissionRequestBodySchema
>;

export type ApplicantDraftSubmissionResponseBody = z.infer<
  typeof Applicants.ApplicantDraftSubmissionResponseBodySchema
>;

export type RawApplicantSubmissionBody = z.input<
  typeof Applicants.ApplicantCreateSubmissionRequestBodySchema
>;

export type ParsedApplicantSubmissionBody = z.output<
  typeof Applicants.ApplicantCreateSubmissionRequestBodySchema
>;

export type ApplicantUpdateBody = z.infer<
  typeof Applicants.ApplicantUpdateRequestBodySchema
>;

export type ApplicantResponseBody = z.infer<
  typeof Applicants.ApplicantCreateResponseBodySchema
>;

export type ApplicantStateRequestBody = z.infer<
  typeof Applicants.ApplicantStateRequestBodySchema
>;

export type ApplicantStateResponseBody = z.infer<
  typeof Applicants.ApplicantStateResponseBodySchema
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

export type ApplicantGetResponseBody = z.infer<
  typeof Applicants.ApplicantGetResponseBodySchema
>;

// Custom type to represent Prisma query on ApplicantSubmission with a JOIN on Upload table
export type PrismaApplicantSubmissionWithResume = ApplicantSubmission &
  ResumeUpload;
export type PrismaApplicantDraftSubmissionWithResume =
  ApplicantDraftSubmission & ResumeUpload;
