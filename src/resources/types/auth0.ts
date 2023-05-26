import { Request } from 'express';
import { AuthResult } from 'express-oauth2-jwt-bearer';
import { z } from 'zod';
import {
  Auth0ApiConfigSchema,
  Auth0ExpressConfigSchema,
  ShellUserPayloadSchema,
} from '../schemas/auth0.js';

export type Auth0UserBody = z.infer<typeof ShellUserPayloadSchema>;

export type Auth0ApiConfig = z.infer<typeof Auth0ApiConfigSchema>;

export type Auth0ExpressConfig = z.infer<typeof Auth0ExpressConfigSchema>;

export const Claims = {
  email: 'auth0.capp.com/email',
};

// Declaration merging for our custom added JWT claim
declare module 'express-oauth2-jwt-bearer' {
  export interface JWTPayload {
    'auth0.capp.com/email': string; // added in Auth0 postLoginAddEmail action
    id?: number; // Applicant ID in db. Added in Authenticator.ts.
  }
  export interface AuthResult {
    payload: JWTPayload;
  }
}

export interface RequestWithJWT extends Request {
  auth: AuthResult;
}
