import { z } from 'zod';
import {
  Auth0Config as Auth0ConfigSchema,
  ShellUserPayload,
} from '../zodSchemas/auth0Schemas.js';

export type Auth0UserBody = z.infer<typeof ShellUserPayload>;

export type Auth0Config = z.infer<typeof Auth0ConfigSchema>;
