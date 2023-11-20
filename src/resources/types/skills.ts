import { z } from 'zod';
import { Skills } from '@capp/schemas';

export type SkillGetResponseBody = z.infer<
  typeof Skills.SkillGetResponseBodySchema
>;

export type ReferenceSkillsCreateRequestBody = z.infer<
  typeof Skills.ReferenceSkillsCreateRequestBodySchema
>;

export type ReferenceSkillsCreateResponseBody = z.infer<
  typeof Skills.ReferenceSkillsCreateResponseBodySchema
>;
