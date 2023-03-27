import { z } from 'zod';
import {
  ApplicantRequestBodySchema,
  ApplicantResponseBodySchema,
  ApplicantQueryParamsSchema,
  ApplicantSubmissionRequestBodySchema,
} from '../schemas/applicants.js';

export type ApplicantQueryParams = z.infer<typeof ApplicantQueryParamsSchema>;

export type ApplicantRequestBody = z.infer<typeof ApplicantRequestBodySchema>;

export type ApplicantSubmissionBody = z.infer<
  typeof ApplicantSubmissionRequestBodySchema
>;

export type ApplicantResponseBody = z.infer<typeof ApplicantResponseBodySchema>;
