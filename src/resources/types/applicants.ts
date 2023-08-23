import { ApplicantSubmission, ApplicantDraftSubmission } from '@prisma/client';
import { z } from 'zod';
import { Applicants } from 'schemas';

export type ApplicantRequestBody = z.infer<
  typeof Applicants.ApplicantRequestBodySchema
>;

export type ApplicantDraftSubmissionBody = z.infer<
  typeof Applicants.ApplicantDraftSubmissionRequestBodySchema
>;

export type ApplicantDraftSubmissionResponseBody = z.infer<
  typeof Applicants.ApplicantDraftSubmissionResponseBodySchema
>;

export type ApplicantSubmissionBody = z.infer<
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
