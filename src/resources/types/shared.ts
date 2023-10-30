import { z, ZodIssue } from 'zod';
import ConfigSchema from '@App/resources/schemas/shared.js';

export type Problem = {
  title?: string; // HTTP error name e.g. "Unauthorized"
  status?: number; // HTTP status code
  detail?: string | ZodIssue; // The detailed error message
  type?: string;
  instance?: string;
  stack?: string;
};

export type IdOnly = {
  id: number;
};

export type BaseConfig = z.infer<typeof ConfigSchema>;

declare module 'express-session' {
  interface Session {
    applicant: IdOnly;
  }
}
