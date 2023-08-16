import { z } from 'zod';
import { applicants } from 'schemas';

export type ApplicantRequestBody = z.infer<
  typeof applicants.ApplicantRequestBodySchema
>;

export type ApplicantDraftSubmissionBody = z.infer<
  typeof applicants.ApplicantDraftSubmissionRequestBodySchema
>;

export type ApplicantDraftSubmissionResponseBody = z.infer<
  typeof applicants.ApplicantDraftSubmissionResponseBodySchema
>;

export type ApplicantSubmissionBody = z.infer<
  typeof applicants.ApplicantSubmissionRequestBodySchema
>;

export type ApplicantUpdateBody = z.infer<
  typeof applicants.ApplicantUpdateRequestBodySchema
>;

export type ApplicantResponseBody = z.infer<
  typeof applicants.ApplicantResponseBodySchema
>;

export type ApplicantStateBody = z.infer<
  typeof applicants.ApplicantStateRequestBodySchema
>;
