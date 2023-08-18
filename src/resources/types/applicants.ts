// import { ApplicantDraftSubmission, ApplicantSubmission } from '@prisma/client';
import { ApplicantSubmission, ApplicantDraftSubmission } from '@prisma/client';
import { z } from 'zod';
import {
  ApplicantRequestBodySchema,
  ApplicantResponseBodySchema,
  ApplicantCreateSubmissionRequestBodySchema,
  ApplicantDraftSubmissionRequestBodySchema,
  ApplicantStateRequestBodySchema,
  ApplicantDraftSubmissionResponseBodySchema,
  ApplicantUpdateRequestBodySchema,
  ApplicantCreateSubmissionResponseBodySchema,
} from '../schemas/applicants.js';

export type ApplicantRequestBody = z.infer<typeof ApplicantRequestBodySchema>;

export type ApplicantDraftSubmissionBody = z.infer<
  typeof ApplicantDraftSubmissionRequestBodySchema
>;

export type ApplicantDraftSubmissionResponseBody = z.infer<
  typeof ApplicantDraftSubmissionResponseBodySchema
>;

export type ApplicantSubmissionBody = z.infer<
  typeof ApplicantCreateSubmissionRequestBodySchema
>;

export type ApplicantUpdateBody = z.infer<
  typeof ApplicantUpdateRequestBodySchema
>;

export type ApplicantResponseBody = z.infer<typeof ApplicantResponseBodySchema>;

export type ApplicantStateBody = z.infer<
  typeof ApplicantStateRequestBodySchema
>;

export type ResumeUpload = {
  resumeUpload: null | {
    id: number;
    originalFilename: string;
  };
};

export type ApplicantCreateSubmissionResponse = z.infer<
  typeof ApplicantCreateSubmissionResponseBodySchema
>;

// Custom type to represent Prisma query on ApplicantSubmission with a JOIN on Upload table
export type PrismaApplicantSubmissionWithResume = ApplicantSubmission &
  ResumeUpload;
export type PrismaApplicantDraftSubmissionWithResume =
  ApplicantDraftSubmission & ResumeUpload;
