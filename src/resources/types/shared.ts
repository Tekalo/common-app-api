import { z } from 'zod';
import { BaseConfigSchema, AWSConfigSchema } from '../schemas/shared.js';

export type Problem = {
  title?: string; // HTTP error name e.g. "Unauthorized"
  status?: number; // HTTP status code
  detail?: string; // The detailed error message
  type?: string;
  instance?: string;
};

export type SessionCookie = {
  id: number;
};

export type AWSConfig = z.infer<typeof AWSConfigSchema>;

export type BaseConfig = z.infer<typeof BaseConfigSchema>;

declare module 'express-session' {
  interface Session {
    applicant: SessionCookie;
  }
}
