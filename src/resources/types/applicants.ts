import { z } from 'zod';
import {
  ApplicantRequestBodySchema,
  ApplicantResponseBodySchema,
  ApplicantSubmissionRequestBodySchema,
  ApplicantDraftSubmissionRequestBodySchema,
  ApplicantStateRequestBodySchema,
  ApplicantDraftSubmissionResponseBodySchema,
  ApplicantUpdateRequestBodySchema,
} from '../schemas/applicants.js';

export type ApplicantRequestBody = z.infer<typeof ApplicantRequestBodySchema>;

export type ApplicantDraftSubmissionBody = z.infer<
  typeof ApplicantDraftSubmissionRequestBodySchema
>;

export type ApplicantDraftSubmissionResponseBody = z.infer<
  typeof ApplicantDraftSubmissionResponseBodySchema
>;

export type ApplicantSubmissionBody = z.infer<
  typeof ApplicantSubmissionRequestBodySchema
>;

export type ApplicantUpdateBody = z.infer<
  typeof ApplicantUpdateRequestBodySchema
>;

export type ApplicantResponseBody = z.infer<typeof ApplicantResponseBodySchema>;

export type ApplicantStateBody = z.infer<
  typeof ApplicantStateRequestBodySchema
>;
