import { z } from 'zod';
import {
  ApplicantRequestBodySchema,
  ApplicantResponseBodySchema,
  ApplicantQueryParamsSchema,
} from '../schemas/applicants.js';

export type ApplicantQueryParams = z.infer<typeof ApplicantQueryParamsSchema>;

export type ApplicantRequestBody = z.infer<typeof ApplicantRequestBodySchema>;

export type ApplicantResponseBody = z.infer<typeof ApplicantResponseBodySchema>;
