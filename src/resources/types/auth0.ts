import { Request } from 'express';
import { AuthResult } from 'express-oauth2-jwt-bearer';
import { z } from 'zod';
import { auth0 } from 'schemas';

export type Auth0UserBody = z.infer<typeof auth0.ShellUserPayloadSchema>;

export type Auth0ApiConfig = z.infer<typeof auth0.Auth0ApiConfigSchema>;

export type Auth0ExpressConfig = z.infer<typeof auth0.Auth0ExpressConfigSchema>;

export const Claims = {
  email: 'auth0.capp.com/email',
  roles: 'auth0.capp.com/roles',
};

// Declaration merging for our custom added JWT claim
declare module 'express-oauth2-jwt-bearer' {
  export interface JWTPayload {
    'auth0.capp.com/email'?: string; // added in Auth0 postLoginAddEmail action
    'auth0.capp.com/roles'?: string[]; // added in Auth0 postLoginAddRoles action
    id?: number; // Applicant ID in db. Added in Authenticator.setApplicantID()
    scope?: string; // Space seperated string of scopes granted to auth0 user/application
  }
  export interface AuthResult {
    payload: JWTPayload;
  }
}

export interface RequestWithJWT extends Request {
  auth: AuthResult;
}

export interface AuthRequest extends Request {
  authError?: Error;
}
