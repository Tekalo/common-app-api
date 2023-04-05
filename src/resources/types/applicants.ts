import { z } from 'zod';
import {
  ApplicantRequestBodySchema,
  ApplicantResponseBodySchema,
  ApplicantSubmissionRequestBodySchema,
  ApplicantDraftSubmissionRequestBodySchema,
} from '../schemas/applicants.js';

export type ApplicantRequestBody = z.infer<typeof ApplicantRequestBodySchema>;

export type ApplicantDraftSubmissionBody = z.infer<
  typeof ApplicantDraftSubmissionRequestBodySchema
>;

export type ApplicantSubmissionBody = z.infer<
  typeof ApplicantSubmissionRequestBodySchema
>;

export type ApplicantResponseBody = z.infer<typeof ApplicantResponseBodySchema>;
