import { z } from 'zod'
import { Skills } from '@capp/schemas';

export type SkillGetResponseBody = z.infer<
  typeof Skills.SkillGetResponseBodySchema
>;