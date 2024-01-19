import { z } from 'zod';
import { Causes } from '@capp/schemas';

export type CauseGetResponseBody = z.infer<
  typeof Causes.CauseGetResponseBodySchema
>;
