import { z } from 'zod';
import { Auth0Config, UserPayload } from '../zodSchemas/auth0Schemas.js';

export type Auth0UserBody = z.infer<typeof UserPayload>;

export type Auth0Config = z.infer<typeof Auth0Config>