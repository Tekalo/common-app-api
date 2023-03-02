import { z } from 'zod';
import UserPayload from '../zodSchemas/auth0RequestSchemas.js';

export type Auth0UserBody = z.infer<typeof UserPayload>;
