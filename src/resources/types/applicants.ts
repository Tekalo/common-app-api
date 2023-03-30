import { z } from 'zod';
import {
  ApplicantRequestBodySchema,
  ApplicantResponseBodySchema,
} from '../schemas/applicants.js';

export type ApplicantRequestBody = z.infer<typeof ApplicantRequestBodySchema>;

export type ApplicantResponseBody = z.infer<typeof ApplicantResponseBodySchema>;
