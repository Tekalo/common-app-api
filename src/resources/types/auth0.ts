import { z } from 'zod';
import {
  Auth0ApiConfigSchema,
  Auth0ExpressConfigSchema,
  ShellUserPayloadSchema,
} from '../schemas/auth0.js';

export type Auth0UserBody = z.infer<typeof ShellUserPayloadSchema>;

export type Auth0ApiConfig = z.infer<typeof Auth0ApiConfigSchema>;

export type Auth0ExpressConfig = z.infer<typeof Auth0ExpressConfigSchema>;

declare module 'express-oauth2-jwt-bearer' {
  export interface JWTPayload {
    'auth0.capp.com/email': string;
  }
}
