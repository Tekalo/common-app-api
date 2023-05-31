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
  roles: 'auth0.capp.com/roles',
};

// Declaration merging for our custom added JWT claim
declare module 'express-oauth2-jwt-bearer' {
  export interface JWTPayload {
    'auth0.capp.com/email': string; // added in Auth0 postLoginAddEmail action
    'auth0.capp.com/roles': string[]; // added in Autho0 postLoginAddRoles action
    id: number; // added in Authenticator.setApplicantID()
  }
  export interface AuthResult {
    payload: JWTPayload;
  }
}

export interface RequestWithJWT extends Request {
  auth: AuthResult;
}
