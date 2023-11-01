import { z, ZodIssue } from 'zod';
import ConfigSchema from '@App/resources/schemas/shared.js';
import { Shared } from '@capp/schemas';

export type Problem = {
  title?: string; // HTTP error name e.g. "Unauthorized"
  status?: number; // HTTP status code
  detail?: string | ZodIssue; // The detailed error message
  type?: string;
  instance?: string;
  stack?: string;
};

export type IdOnly = z.infer<typeof Shared.IdOnlySchema>;

export type BaseConfig = z.infer<typeof ConfigSchema>;

declare module 'express-session' {
  interface Session {
    applicant: IdOnly;
  }
}
