import { z } from 'zod';
import ApplicantResponseSchema from '../zodSchemas/apiResponseSchemas.js';

export type Problem = {
  title?: string; // HTTP error name e.g. "Unauthorized"
  status?: number; // HTTP status code
  detail?: string; // The detailed error message
  type?: string;
  instance?: string;
};

export type ApplicantResponse = z.infer<typeof ApplicantResponseSchema>;
