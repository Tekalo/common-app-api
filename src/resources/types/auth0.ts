import { z } from 'zod';
import { Auth0ConfigSchema, ShellUserPayloadSchema } from '../schemas/auth0.js';

export type Auth0UserBody = z.infer<typeof ShellUserPayloadSchema>;

export type Auth0Config = z.infer<typeof Auth0ConfigSchema>;
